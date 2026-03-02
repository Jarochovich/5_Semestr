using Microsoft.Extensions.Logging;
using System;
using System.IO;

namespace ASPA0011_1.Logging
{
    public class FileLogger : ILogger
    {
        private readonly string _filePath;
        private readonly string _name;
        private readonly LogLevel _targetLevel; // Теперь храним целевой уровень
        private readonly bool _isDevelopment;
        private readonly object _lock = new();
        private static int _eventCounter = 0;

        public FileLogger(string name, string filePath, LogLevel targetLevel, bool isDevelopment = false)
        {
            _name = name;
            _filePath = filePath;
            _targetLevel = targetLevel; // Конкретный уровень для этого логгера
            _isDevelopment = isDevelopment;
        }

        public IDisposable? BeginScope<TState>(TState state) => null;

        public bool IsEnabled(LogLevel logLevel)
        {
            if (logLevel == LogLevel.None)
                return false;

            // Проверяем, что это именно наш целевой уровень
            if (logLevel != _targetLevel)
                return false;

            // Для Trace и Debug включаем только в режиме Development
            if ((logLevel == LogLevel.Trace || logLevel == LogLevel.Debug) && !_isDevelopment)
                return false;

            return true;
        }

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (!IsEnabled(logLevel))
                return;

            var logRecord = $"{++_eventCounter} {DateTime.Now:yyyy-MM-dd HH:mm:ss} [{logLevel}] {_name}: {formatter(state, exception)}";

            if (exception != null)
                logRecord += Environment.NewLine + $"Exception: {exception}";

            WriteToFile(logRecord, logLevel);

            // Выводим в консоль только Warning и выше
            if (logLevel >= LogLevel.Warning)
            {
                Console.WriteLine($"[{logLevel}] {formatter(state, exception)}");
            }
        }

        private void WriteToFile(string logRecord, LogLevel logLevel)
        {
            lock (_lock)
            {
                try
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(_filePath)!);
                    File.AppendAllText(_filePath, logRecord + Environment.NewLine);
                }
                catch (Exception ex)
                {
                    if (logLevel == LogLevel.Critical)
                    {
                        Console.WriteLine($"CRITICAL: Не удалось записать в файл {_filePath}: {ex.Message}");
                    }
                }
            }
        }
    }
}