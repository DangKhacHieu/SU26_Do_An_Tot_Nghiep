using System;
using Npgsql;

class Program
{
    static void Main()
    {
        string connString = "Host=YOUR_HOST;Port=YOUR_PORT;Database=YOUR_DB;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true";
        using var conn = new NpgsqlConnection(connString);
        conn.Open();

        using var cmd = new NpgsqlCommand("DELETE FROM stalls WHERE size = 'NaN'; DELETE FROM areas WHERE size = 'NaN'; DELETE FROM markets WHERE size = 'NaN';", conn);
        int rows = cmd.ExecuteNonQuery();
        Console.WriteLine($"Deleted {rows} NaN rows.");

        using var cmd2 = new NpgsqlCommand("DELETE FROM markets WHERE name LIKE 'TestMarket%';", conn);
        int rows2 = cmd2.ExecuteNonQuery();
        Console.WriteLine($"Deleted {rows2} Test markets.");
    }
}
