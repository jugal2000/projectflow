<?php

use Illuminate\Support\Facades\Broadcast;


Broadcast::channel('project.{projectId}', function ($user, $projectId) {

    return true;
});
