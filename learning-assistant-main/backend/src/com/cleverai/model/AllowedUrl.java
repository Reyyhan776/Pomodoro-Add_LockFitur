package com.cleverai.model;

public class AllowedUrl {
    private int id;
    private String url;
    private String label;
    private String iconEmoji;
    private int createdBy;
    private String createdAt;

    public AllowedUrl() {}

    public AllowedUrl(int id, String url, String label, String iconEmoji, int createdBy, String createdAt) {
        this.id = id;
        this.url = url;
        this.label = label;
        this.iconEmoji = iconEmoji;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getIconEmoji() { return iconEmoji; }
    public void setIconEmoji(String iconEmoji) { this.iconEmoji = iconEmoji; }

    public int getCreatedBy() { return createdBy; }
    public void setCreatedBy(int createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
