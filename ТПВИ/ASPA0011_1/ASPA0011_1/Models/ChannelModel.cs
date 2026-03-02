namespace ASPA0011_1.Models
{
    public class ChannelModel
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string State { get; set; } = "ACTIVE";
        public string Description { get; set; } = string.Empty;
        public int MessageCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
