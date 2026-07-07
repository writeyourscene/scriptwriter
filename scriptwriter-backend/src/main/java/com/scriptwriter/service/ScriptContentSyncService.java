package com.scriptwriter.service;

import com.scriptwriter.entity.Script;

public interface ScriptContentSyncService {

    void syncFromScriptContent(Script script, Long userId);
}
