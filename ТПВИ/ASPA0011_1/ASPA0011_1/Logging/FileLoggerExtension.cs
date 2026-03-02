using Microsoft.Extensions.Logging;

namespace ASPA0011_1.Logging
{
    public static class FileLoggerExtensions
    {
        // Теперь принимает конкретный уровень, а не диапазон
        public static ILoggingBuilder AddFileForLevel(this ILoggingBuilder builder, string filePath,
                                                     LogLevel level, bool isDevelopment = false)
        {
            builder.AddProvider(new FileLoggerProvider(filePath, level, isDevelopment));
            return builder;
        }
    }
}