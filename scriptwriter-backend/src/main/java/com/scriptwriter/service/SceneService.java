package com.scriptwriter.service;

import com.scriptwriter.dto.request.*;
import com.scriptwriter.dto.response.SceneResponse;
import com.scriptwriter.dto.response.SceneStatisticsResponse;
import com.scriptwriter.enums.SceneStatus;

import java.util.List;

public interface SceneService {

    SceneResponse create(Long userId, CreateSceneRequest request);

    List<SceneResponse> list(Long userId, Long projectId, Long scriptId, String search, SceneStatus status, Boolean favorite);

    SceneResponse getById(Long userId, Long id);

    SceneResponse update(Long userId, Long id, UpdateSceneRequest request);

    void delete(Long userId, Long id);

    List<SceneResponse> reorder(Long userId, ReorderScenesRequest request);

    SceneStatisticsResponse getStatistics(Long userId, Long id);
}
