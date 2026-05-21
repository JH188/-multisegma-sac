package com.lisume.backend.dto;

import java.math.BigDecimal;

public class ProductRequest {

    private String name;
    private BigDecimal price;
    private String description;
    private String imageUrl;
    private String category;
    private Boolean active;

    // Jackson necesita constructor vacío
    public ProductRequest() {
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getCategory() {
        return category;
    }

    public Boolean getActive() {
        return active;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}