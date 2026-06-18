package com.lisume.backend.dto;

public class ResetPasswordRequest {
    private String email;
    private String code;
    private String newPassword;

    public String getEmail() {
        return email;
    }

    public String getCode() {
        return code;
    }

    public String getNewPassword() {
        return newPassword;
    }
}