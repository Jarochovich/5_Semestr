using ASPA0011_1.Models;
using ASPA0011_1.Services;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Channels;
using System.Xml.Linq;

namespace ASPA0011_1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChannelsController : ControllerBase
    {
        private readonly ChannelService _service;
        private readonly ILogger<ChannelsController> _logger;
        private readonly IConfiguration _config;

        public ChannelsController(ChannelService service, ILogger<ChannelsController> logger, IConfiguration config)
        {
            _service = service;
            _logger = logger;
            _config = config;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            _logger.LogTrace("Начало обработки GET /api/channels");

            var channels = _service.GetChannels();

            _logger.LogDebug("Получено каналов: {Count}", channels?.Count() ?? 0);
            _logger.LogTrace("Завершение GET /api/channels");

            return channels == null ? NoContent() : Ok(channels);
        }


        [HttpGet("{id:guid}")]
        public IActionResult Get(Guid id)
        {
            _logger.LogTrace("Начало обработки GET /api/channels/{Id}", id);

            var channel = _service.GetChannel(id);

            if (channel == null)
            {
                _logger.LogDebug("Канал {Id} не найден", id);
            }
            else
            {
                _logger.LogDebug("Найден канал: {Name} ({Id})", channel.Name, channel.Id);
            }

            _logger.LogTrace("Завершение GET /api/channels/{Id}", id);

            return channel == null ? NotFound() : Ok(channel);
        }


        [HttpPost]
        public IActionResult Create([FromBody] JsonElement body)
        {
            _logger.LogTrace("Начало обработки POST /api/channels");
            _logger.LogDebug("Тело запроса: {Body}", body.ToString());

            string name = body.TryGetProperty("name", out var nameProp)
                ? nameProp.GetString() ?? "Channel"
                : "Channel";

            string state = body.TryGetProperty("state", out var stateProp)
                ? stateProp.GetString()?.ToUpper() ?? "ACTIVE"
                : "ACTIVE";

            string description = body.TryGetProperty("description", out var descriptionProp)
                ? descriptionProp.GetString() ?? "Описания нет"
                : "Описания нет";

            var ch = _service.CreateChannel(name);
            ch.State = state;
            ch.Description = description;

            if (state == "CLOSED")
            {
                _logger.LogInformation("Создан канал {Name} в состоянии CLOSED", name);
                return NoContent();
            }

        


            _logger.LogInformation("Создан канал {Name} в состоянии ACTIVE", name);
            _logger.LogTrace("Завершение POST /api/channels");
            return CreatedAtAction(nameof(Get), new { id = ch.Id }, ch);
        }

        [HttpPut]
        public IActionResult Update([FromBody] JsonElement body)
        {
            if (!body.TryGetProperty("command", out var commandProp))
                return BadRequest(new { error = "Поле 'command' обязательно" });

            string command = commandProp.GetString()?.ToLower() ?? "";
            string reason = body.TryGetProperty("reason", out var reasonProp)
                ? reasonProp.GetString() ?? ""
                : "";

            bool hasId = body.TryGetProperty("id", out var idProp);
            Guid id = Guid.Empty;
            if (hasId)
            {
                if (!Guid.TryParse(idProp.GetString(), out id))
                    return BadRequest(new { error = "Некорректный формат GUID" });
            }

            switch (command)
            {
                case "close":
                    if (hasId)
                    {
                        if (_service.CloseChannel(id, reason))
                        {
                            _logger.LogInformation("Канал {Id} остановлен. Причина: {Reason}", id, reason);
                            return Ok(_service.GetChannel(id));
                        }
                        _logger.LogError("Канал {Id} не найден для закрытия", id);
                        return NotFound();
                    }
                    else
                    {
                        _service.CloseAllChannels(reason);
                        _logger.LogInformation("Все каналы остановлены. Причина: {Reason}", reason);
                        return Ok(_service.GetChannels());
                    }

                case "open":
                    if (hasId)
                    {
                        if (_service.OpenChannel(id))
                        {
                            _logger.LogInformation("Канал {Id} возобновлён", id);
                            return Ok(_service.GetChannel(id));
                        }
                        _logger.LogError("Канал {Id} не найден для возобновления", id);
                        return NotFound();
                    }
                    else
                    {
                        _service.OpenAllChannels();
                        _logger.LogInformation("Все каналы возобновлены");
                        return Ok(_service.GetChannels());
                    }

                default:
                    _logger.LogError("Неизвестная команда PUT: {Command}", command);
                    return BadRequest(new { error = "Неверная команда. Используйте 'open' или 'close'." });
            }
        }


        [HttpDelete]
        public IActionResult Delete([FromBody] JsonElement body)
        {
            // проверяем, что передано поле "command"
            if (!body.TryGetProperty("command", out var commandProp))
                return BadRequest(new { error = "Поле 'command' обязательно" });

            string command = commandProp.GetString()?.ToLower() ?? "";

            if (command != "del")
            {
                _logger.LogError("Неверная команда DELETE: {Command}", command);
                return BadRequest(new { error = "Поддерживается только команда 'del'" });
            }

            // проверяем наличие "state"
            string? state = null;
            if (body.TryGetProperty("state", out var stateProp))
                state = stateProp.GetString()?.ToUpper();

            int deletedCount = 0;

            if (state == null)
            {
                deletedCount = _service.DeleteAllChannels();
                _logger.LogInformation("Удалены все каналы ({Count})", deletedCount);
            }
            else
            {
                deletedCount = _service.DeleteByState(state);
                _logger.LogInformation("Удалены каналы со состоянием {State} ({Count})", state, deletedCount);
            }

            if (deletedCount == 0)
            {
                _logger.LogWarning("Каналы для удаления не найдены (state={State})", state);
                return NotFound(new { message = "Каналы для удаления не найдены" });
            }

            // возвращаем оставшиеся каналы
            return Ok(_service.GetChannels());
        }

        [HttpPost("/api/queue")]
        public async Task<IActionResult> ProcessQueue([FromBody] JsonElement body)
        {
            _logger.LogTrace("Начало обработки POST /api/queue");
            _logger.LogDebug("Тело запроса queue: {Body}", body.ToString());

            if (!body.TryGetProperty("command", out var cmdProp))
                return BadRequest(new { error = "Поле 'command' обязательно" });

            if (!body.TryGetProperty("id", out var idProp))
                return BadRequest(new { error = "Поле 'id' обязательно" });

            string command = cmdProp.GetString()?.ToLower() ?? "";
            if (!Guid.TryParse(idProp.GetString(), out Guid id))
                return BadRequest(new { error = "Некорректный формат GUID" });

            try
            {
                switch (command)
                {
                    case "enqueue":
                        if (!body.TryGetProperty("data", out var dataProp))
                            return BadRequest(new { id, error = "Поле 'data' обязательно для enqueue" });

                        string data = dataProp.GetString() ?? "";

                        await _service.EnqueueAsync(id, data, _config.GetValue<int>("WaitEnqueue", 5));

                        _logger.LogDebug("Enqueue в канал {Id}: {Data}", id, data);
                        _logger.LogTrace("Завершение POST /api/queue");
                        return Ok(new { id, data });


                    case "dequeue":
                        var msg = await _service.DequeueAsync(id);
                        if (msg == null)
                        {
                            _logger.LogWarning("Очередь канала {Id} пуста (dequeue)", id);
                            return NotFound(new { id, error = "Очередь пуста" });
                        }

                        _logger.LogDebug("Dequeue из канала {Id}: {Msg}", id, msg);
                        _logger.LogTrace("Завершение POST /api/queue");
                        return Ok(new { id, data = msg });

                    // прочитать первый элемент
                    case "peek":
                        var peekMsg = _service.Peek(id);
                        if (peekMsg == null)
                        {
                            _logger.LogWarning("Очередь канала {Id} пуста (peek)", id);
                            return NotFound(new { id, error = "Очередь пуста" });
                        }

                        _logger.LogDebug("Peek из канала {Id}: {Msg}", id, peekMsg);
                        _logger.LogTrace("Завершение POST /api/queue");
                        return Ok(new { id, data = peekMsg });

                    default:
                        _logger.LogError("Неизвестная команда POST /api/queue: {Command}", command);
                        _logger.LogTrace("Завершение POST /api/queue");
                        return BadRequest(new { id, error = "Неверная команда. Используйте enqueue, dequeue или peek." });
                }
            }
            catch (KeyNotFoundException)
            {
                _logger.LogError("Канал {Id} не найден для команды {Command}", id, command);
                return NotFound(new { id, error = "Канал не найден" });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("закрытый канал"))
            {
                // обработка для закрытых каналов
                _logger.LogWarning("Попытка выполнить {Command} для закрытого канала {Id}", command, id);
                return BadRequest(new { id, error = "Нельзя выполнить операцию для закрытого канала" });
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Истекло ожидание WaitEnqueue для канала {Id}", id);
                return StatusCode(408, new { id, error = "Истекло ожидание при enqueue" });
            }
            catch (InvalidOperationException ex)
            {
                // обработка других InvalidOperationException
                _logger.LogError("Ошибка операции для канала {Id}: {Message}", id, ex.Message);
                return BadRequest(new { id, error = ex.Message });
            }
        }

    }
}