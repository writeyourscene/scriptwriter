package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiResponse {

    private String result;
    private String explanation;
    private Long historyId;
}
