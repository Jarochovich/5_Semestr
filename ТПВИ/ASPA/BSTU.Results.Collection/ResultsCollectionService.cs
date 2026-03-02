using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Linq;

namespace BSTU.Results.Collection
{
    public class ResultsCollectionService
    {
        private readonly string _filePath;
        private readonly ConcurrentDictionary<int, string> _results;
        private readonly object _fileLock = new object();
        private int _nextId = 1;

        public ResultsCollectionService()
        {
            _filePath = Path.Combine(Directory.GetCurrentDirectory(), "results.json");
            _results = LoadResults();
        }

        public IEnumerable<KeyValuePair<int, string>> GetAll()
        {
            return _results.ToArray();
        }

        public string Get(int key) //
        {
            string value;
            return _results.TryGetValue(key, out value) ? value : null;
        }

        public KeyValuePair<int, string> Add(string value)
        {
            lock (_fileLock)
            {
                var item = new KeyValuePair<int, string>(_nextId, value);
                _results[_nextId] = value;
                _nextId++;
                SaveResults();
                return item;
            }
        }

        public KeyValuePair<int, string>? Update(int key, string value)
        {
            lock (_fileLock)
            {
                if (!_results.ContainsKey(key))
                    return null;

                _results[key] = value;
                SaveResults();
                return new KeyValuePair<int, string>(key, value);
            }
        }

        public KeyValuePair<int, string>? Delete(int key)
        {
            lock (_fileLock)
            {
                if (_results.TryRemove(key, out var value))
                {
                    SaveResults();
                    return new KeyValuePair<int, string>(key, value);
                }
                return null;
            }
        }

        private ConcurrentDictionary<int, string> LoadResults()
        {
            lock (_fileLock)
            {
                if (!File.Exists(_filePath))
                    return new ConcurrentDictionary<int, string>();

                var json = File.ReadAllText(_filePath);
                var data = JsonSerializer.Deserialize<Dictionary<int, string>>(json);

                if (data?.Any() == true)
                {
                    _nextId = data.Keys.Max() + 1;
                    return new ConcurrentDictionary<int, string>(data);
                }

                return new ConcurrentDictionary<int, string>();
            }
        }

        private void SaveResults()
        {
            lock (_fileLock)
            {
                var options = new JsonSerializerOptions { WriteIndented = true };
                var json = JsonSerializer.Serialize(_results, options);
                File.WriteAllText(_filePath, json);
            }
        }
    }
}