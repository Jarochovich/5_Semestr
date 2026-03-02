using ASPA0011_1.Logging;
using ASPA0011_1.Services;
using Microsoft.Extensions.Logging;

namespace ASPA0011_1
{
    public class Program
    {
        public static void Main(string[] args)
        {
            try
            {
                var builder = WebApplication.CreateBuilder(args);

                // Настройка логирования
                ConfigureLogging(builder);

                // Регистрация сервисов
                builder.Services.AddSingleton<ChannelService>();
                builder.Services.AddControllers();

                var app = builder.Build();

                // Middleware для обработки ошибок
                app.Use(async (context, next) =>
                {
                    try
                    {
                        await next();
                    }
                    catch (Exception ex)
                    {
                        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

                        // Определяем уровень логирования
                        var logLevel = ex is FileNotFoundException or DirectoryNotFoundException
                            ? LogLevel.Critical
                            : LogLevel.Error;

                        logger.Log(logLevel, ex, "Ошибка при обработке запроса: {Path}", context.Request.Path);
                        throw;
                    }
                });

                if (app.Environment.IsDevelopment())
                    app.UseDeveloperExceptionPage();

                app.MapControllers();

                var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
                startupLogger.LogInformation("Приложение успешно запущено в среде: {Environment}",
                    app.Environment.EnvironmentName);

                app.Run();
            }
            catch (Exception ex)
            {
                // Критические ошибки при запуске - только в консоль
                Console.WriteLine($"CRITICAL: Ошибка при запуске приложения: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Внутренняя ошибка: {ex.InnerException.Message}");
                }
                Environment.Exit(1);
            }
        }

        private static void ConfigureLogging(WebApplicationBuilder builder)
        {
            builder.Logging.ClearProviders();

            var isDevelopment = builder.Environment.IsDevelopment();

            if (isDevelopment)
            {
                // Каждый уровень логирования в свой файл
                builder.Logging.AddFileForLevel("Logs/trace.log", LogLevel.Trace, isDevelopment: true);
                builder.Logging.AddFileForLevel("Logs/debug.log", LogLevel.Debug, isDevelopment: true);
                builder.Logging.AddFileForLevel("Logs/information.log", LogLevel.Information);
                builder.Logging.AddFileForLevel("Logs/warning.log", LogLevel.Warning);
                builder.Logging.AddFileForLevel("Logs/error.log", LogLevel.Error);
                builder.Logging.AddFileForLevel("Logs/critical.log", LogLevel.Critical);

                builder.Logging.AddDebug();
            }
            else
            {
                // В Production не добавляем Trace и Debug
                builder.Logging.AddFileForLevel("Logs/information.log", LogLevel.Information);
                builder.Logging.AddFileForLevel("Logs/warning.log", LogLevel.Warning);
                builder.Logging.AddFileForLevel("Logs/error.log", LogLevel.Error);
                builder.Logging.AddFileForLevel("Logs/critical.log", LogLevel.Critical);
            }

            // Консоль - только Warning и выше
            builder.Logging.AddConsole();
            builder.Logging.AddFilter<Microsoft.Extensions.Logging.Console.ConsoleLoggerProvider>
                (level => level >= LogLevel.Warning);

            // Также фильтруем Microsoft стандартные логи в файлы
            builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
        }
    }
}