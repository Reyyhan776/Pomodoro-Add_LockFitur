package com.cleverai.dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AllowedUrlDAO extends AbstractDAO {

    @Override
    protected String getTableName() {
        return "allowed_urls";
    }

    /**
     * Get all allowed URLs (global list, visible to all users).
     */
    public List<Map<String, Object>> getAllUrls() {
        List<Map<String, Object>> urls = new ArrayList<>();
        String sql = "SELECT au.id, au.url, au.label, au.icon_emoji, au.created_by, "
                + "au.created_at, u.username AS created_by_name "
                + "FROM allowed_urls au "
                + "LEFT JOIN users u ON au.created_by = u.id "
                + "ORDER BY au.created_at DESC";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", rs.getInt("id"));
                entry.put("url", rs.getString("url"));
                entry.put("label", rs.getString("label"));
                entry.put("iconEmoji", rs.getString("icon_emoji"));
                entry.put("createdBy", rs.getInt("created_by"));
                entry.put("createdByName", rs.getString("created_by_name"));
                Timestamp ts = rs.getTimestamp("created_at");
                entry.put("createdAt", ts != null ? ts.toString() : "");
                urls.add(entry);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return urls;
    }

    /**
     * Add a new allowed URL (admin only).
     */
    public boolean addUrl(String url, String label, String iconEmoji, int createdBy) {
        String sql = "INSERT INTO allowed_urls (url, label, icon_emoji, created_by) VALUES (?, ?, ?, ?)";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, url);
            ps.setString(2, label);
            ps.setString(3, iconEmoji != null && !iconEmoji.isEmpty() ? iconEmoji : "\uD83C\uDF10");
            ps.setInt(4, createdBy);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Delete an allowed URL by ID (admin only).
     */
    public boolean deleteUrl(int id) {
        String sql = "DELETE FROM allowed_urls WHERE id = ?";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Check if a URL already exists in the whitelist.
     */
    public boolean urlExists(String url) {
        String sql = "SELECT COUNT(*) FROM allowed_urls WHERE url = ?";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, url);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt(1) > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}
