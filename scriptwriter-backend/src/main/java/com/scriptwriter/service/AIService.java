package com.scriptwriter.service;

import com.scriptwriter.dto.request.AiScriptRequest;
import com.scriptwriter.dto.response.AiResponse;
import com.scriptwriter.entity.Script;
import com.scriptwriter.entity.User;

public interface AIService {

    AiResponse process(User user, Script script, AiScriptRequest request);
}
