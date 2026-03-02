using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BSTU.Results.Collection;
using BSTU.Results.Authenticate;
using ASPA0010_1.Models;

namespace ASPA0010_1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResultsController : ControllerBase
    {
        private readonly ResultsCollectionService _resultsService;
        private readonly AuthenticateService _authService;

        public ResultsController(ResultsCollectionService resultsService, AuthenticateService authService)
        {
            _resultsService = resultsService;
            _authService = authService;
        }

        [HttpGet]
        //[Authorize(Policy = "ReaderOnly")]
        public IActionResult GetAll()
        {
            var results = _resultsService.GetAll();
            if (!results.Any())
                return NoContent();

            return Ok(results);
        }

        [HttpGet("{k:int}")]
        [Authorize(Policy = "ReaderOnly")]
        public IActionResult Get(int k)
        {
            var result = _resultsService.Get(k);
            if (result == null)
                return NotFound();

            return Ok(new { key = k, value = result });
        }

        [HttpPost]
        [Authorize(Policy = "WriterOnly")]
        public IActionResult Post([FromBody] ResultItem item)
        {
            if (string.IsNullOrWhiteSpace(item.Value))
                return BadRequest("Value cannot be empty");

            var result = _resultsService.Add(item.Value);
            return CreatedAtAction(nameof(Get), new { k = result.Key }, result);
        }

        [HttpPut("{k:int}")]
        [Authorize(Policy = "WriterOnly")]
        public IActionResult Put(int k, [FromBody] ResultItem item)
        {
            if (string.IsNullOrWhiteSpace(item.Value))
                return BadRequest("Value cannot be empty");

            var result = _resultsService.Update(k, item.Value);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpDelete("{k:int}")]
        [Authorize(Policy = "WriterOnly")]
        public IActionResult Delete(int k)
        {
            var result = _resultsService.Delete(k);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost("SignIn")]
        [AllowAnonymous]
        public async Task<IActionResult> SignIn([FromBody] LoginModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Login) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest("Login and password are required");

            var success = await _authService.SignInAsync(HttpContext, model.Login, model.Password);
            if (!success)
                return NotFound("Invalid login or password");

            return Ok("Signed in successfully");
        }

        [HttpGet("SignOut")]
        [Authorize]
        public async Task<IActionResult> SignOut()
        {
            await _authService.SignOutAsync(HttpContext);

            var token = GenerateToken();
            return Ok(new
            {
                Message = "Signed out successfully",
                Token = token
            });
        }

        [NonAction]
        public string GenerateToken()
        {
            var header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // Заголовок: {"alg":"HS256","typ":"JWT"}
            var payload = Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes(
                    $"{{\"sub\":\"anonymous\",\"role\":\"user\",\"exp\":{DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds()}}}"));
            var signature = "fake-signature-for-testing";

            return $"{header}.{payload}.{signature}";
        }
    }
}