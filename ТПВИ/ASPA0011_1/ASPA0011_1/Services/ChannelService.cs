using ASPA0011_1.Models;
using System.Threading.Channels;

namespace ASPA0011_1.Services
{
    public class ChannelService
    {
        private readonly Dictionary<Guid, Channel<string>> _channels = new();
        private readonly Dictionary<Guid, ChannelModel> _channelInfo = new();
        private readonly ILogger<ChannelService> _logger;

        public ChannelService(ILogger<ChannelService> logger)
        {
            _logger = logger;
        }

        public IEnumerable<ChannelModel> GetChannels() => _channelInfo.Count > 0 ? _channelInfo.Values : null;

        public ChannelModel? GetChannel(Guid id) =>
            _channelInfo.ContainsKey(id) ? _channelInfo[id] : null;

        public ChannelModel CreateChannel(string name)
        {
            _logger.LogTrace("Начало создания канала с именем: {Name}", name);

            var model = new ChannelModel { Name = name };
            _channels[model.Id] = Channel.CreateUnbounded<string>(new UnboundedChannelOptions
            {
                SingleReader = false,
                SingleWriter = false,
                AllowSynchronousContinuations = true
            });
            _channelInfo[model.Id] = model;

            _logger.LogDebug("Создан канал {Name} с ID {Id}", name, model.Id);
            _logger.LogInformation("Создан канал {Name} ({Id})", name, model.Id);

            return model;
        }

        public void CloseAllChannels(string reason)
        {
            foreach (var ch in _channelInfo.Values)
                ch.State = "CLOSED";
        }

        public bool CloseChannel(Guid id, string reason)
        {
            if (_channelInfo.TryGetValue(id, out var ch))
            {
                ch.State = "CLOSED";
                return true;
            }
            return false;
        }

        public void OpenAllChannels()
        {
            foreach (var ch in _channelInfo.Values)
                ch.State = "ACTIVE";
        }

        public bool OpenChannel(Guid id)
        {
            if (_channelInfo.TryGetValue(id, out var ch))
            {
                ch.State = "ACTIVE";
                return true;
            }
            return false;
        }


        public int DeleteAllChannels()
        {
            int count = _channelInfo.Count;
            _channels.Clear();
            _channelInfo.Clear();
            return count;
        }

        public int DeleteByState(string state)
        {
            var toDelete = _channelInfo
                .Where(x => x.Value.State.Equals(state, StringComparison.OrdinalIgnoreCase))
                .Select(x => x.Key)
                .ToList();

            foreach (var id in toDelete)
            {
                _channels.Remove(id);
                _channelInfo.Remove(id);
            }

            return toDelete.Count;
        }

        public async Task EnqueueAsync(Guid id, string message, int waitSeconds)
        {
            _logger.LogTrace("Начало Enqueue в канал {Id}", id);

            if (!_channels.ContainsKey(id))
            {
                _logger.LogError("Канал {Id} не найден", id);
                throw new KeyNotFoundException();
            }

            if (_channelInfo[id].State == "CLOSED")
            {
                _logger.LogWarning("Попытка добавить сообщение в закрытый канал {Id}", id);
                throw new InvalidOperationException("Нельзя добавить сообщение в закрытый канал");
            }

            _logger.LogDebug("Подготовка к записи в канал {Id}: {Message}", id, message);

            var writer = _channels[id].Writer;
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(waitSeconds));

            try
            {
                await writer.WriteAsync(message, cts.Token);
                _channelInfo[id].MessageCount++;
                _logger.LogDebug("Успешный Enqueue в канал {Id}: {Message}", id, message);
                _logger.LogTrace("Enqueue завершен, количество сообщений: {Count}", _channelInfo[id].MessageCount);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Истекло ожидание WaitEnqueue для канала {Id}", id);
                throw;
            }
        }

        public async Task<string?> DequeueAsync(Guid id)
        {
            _logger.LogTrace("Начало Dequeue из канала {Id}", id);

            if (!_channels.ContainsKey(id))
            {
                _logger.LogError("Канал {Id} не найден", id);
                throw new KeyNotFoundException();
            }

            if (_channelInfo[id].State == "CLOSED")
            {
                _logger.LogWarning("Попытка извлечь сообщение из закрытого канала {Id}", id);
                throw new InvalidOperationException("Нельзя извлечь сообщение из закрытого канала");
            }

            var reader = _channels[id].Reader;

            _logger.LogDebug("Ожидание сообщения в канале {Id}", id);

            if (await reader.WaitToReadAsync())
            {
                var msg = await reader.ReadAsync();
                _channelInfo[id].MessageCount--;

                _logger.LogDebug("Успешный Dequeue из канала {Id}: {Message}", id, msg);
                _logger.LogTrace("Dequeue завершен, осталось сообщений: {Count}", _channelInfo[id].MessageCount);

                return msg;
            }

            _logger.LogDebug("Канал {Id} пуст при Dequeue", id);
            return null;
        }

        public string? Peek(Guid id)
        {
            _logger.LogTrace("Начало Peek в канале {Id}", id);

            if (!_channels.ContainsKey(id))
            {
                _logger.LogError("Канал {Id} не найден для операции Peek", id);
                throw new KeyNotFoundException();
            }

            if (_channelInfo[id].State == "CLOSED")
            {
                _logger.LogWarning("Попытка посмотреть сообщение в закрытом канале {Id}", id);
                throw new InvalidOperationException("Нельзя посмотреть сообщение в закрытом канале");
            }

            var reader = _channels[id].Reader;

            _logger.LogDebug("Попытка Peek в канале {Id}", id);

            if (reader.TryPeek(out var message))
            {
                _logger.LogDebug("Успешный Peek в канале {Id}: {Message}", id, message);
                return message;
            }

            _logger.LogDebug("Канал {Id} пуст при Peek", id);
            _logger.LogWarning("Очередь канала {Id} пуста при Peek", id);
            return null;
        }

    }
}
