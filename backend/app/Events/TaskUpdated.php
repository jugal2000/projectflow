<?php

namespace App\Events;

use App\Models\Task;
use App\Http\Resources\TaskResource;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Task $task;
    public string $action;

    /**
     * Create a new event instance.
     *
     * @param Task   $task    The task that changed
     * @param string $action  What happened: 'created', 'updated', 'status_changed', 'deleted'
     */
    public function __construct(Task $task, string $action = 'updated')
    {
        $this->task   = $task;
        $this->action = $action;
    }

    /**
     * The channel the event broadcasts on.
     * We broadcast on a channel specific to the project,
     * so only users viewing THAT project get the update.
     */
    public function broadcastOn(): Channel
    {
        return new Channel("project.{$this->task->project_id}");
    }

    /**
     * The name of the broadcast event (what the frontend listens for).
     */
    public function broadcastAs(): string
    {
        return 'task.updated';
    }

    /**
     * The data sent to the frontend.
     */
    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'task'   => (new TaskResource($this->task->load('assignee')))->resolve(),
        ];
    }
}
