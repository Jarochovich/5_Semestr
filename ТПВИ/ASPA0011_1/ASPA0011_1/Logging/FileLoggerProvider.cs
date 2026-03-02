using Microsoft.Extensions.Logging;

namespace ASPA0011_1.Logging
{
    public class FileLoggerProvider : ILoggerProvider
    {
        private readonly string _filePath;
        private readonly LogLevel _targetLevel; // Конкретный уровень для этого провайдера
        private readonly bool _isDevelopment;

        public FileLoggerProvider(string filePath, LogLevel targetLevel, bool isDevelopment = false)
        {
            _filePath = filePath;
            _targetLevel = targetLevel; // Сохраняем целевой уровень
            _isDevelopment = isDevelopment;
        }

        public ILogger CreateLogger(string categoryName)
        {
            // Создаем логгер только для конкретного уровня
            return new FileLogger(categoryName, _filePath, _targetLevel, _isDevelopment);
        }

        public void Dispose() { }
    }
}