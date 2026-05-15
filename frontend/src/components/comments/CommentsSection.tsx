import React, { useCallback, useEffect, useState } from 'react'
import { commentApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import type { Comment } from '../../types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

// ── SINGLE COMMENT ITEM ───────────────────────────────────────────
// This renders one comment AND its replies (recursively)

interface CommentItemProps {
  comment: Comment
  onReply: (parentId: number) => void
  onDelete: (id: number) => void
  onEdit: (id: number, body: string) => void
  depth?: number   // How deep is this reply? (0 = root, 1 = reply, 2 = reply-to-reply)
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment, onReply, onDelete, onEdit, depth = 0
}) => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody]   = useState(comment.body)
  const [isSaving, setIsSaving]   = useState(false)

  const handleSave = async () => {
    if (!editBody.trim()) return
    setIsSaving(true)
    try {
      await commentApi.update(comment.id, editBody)
      onEdit(comment.id, editBody)   // Update parent state
      setIsEditing(false)
      toast.success('Comment updated')
    } catch (err: unknown) {
      let errorMessage = 'Edit failed'
      if (typeof err === 'object' && err !== null) {
        const response = (err as { response?: { data?: { message?: string } } }).response
        errorMessage = response?.data?.message ?? (err instanceof Error ? err.message : errorMessage)
      }
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    // Indent replies by adding left margin + left border
    <div className={depth > 0 ? 'ml-6 pl-3 border-l-2 border-gray-100' : ''}>
      <div className="bg-gray-50 rounded-lg p-3 mb-2">

        {/* Author row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {comment.author.name}
            </span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Edit button — only visible if user can edit */}
            {comment.can_edit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
              >
                Edit
              </button>
            )}
            {/* Delete button — own comment or admin */}
            {(user?.role === 'admin' || comment.author.id === user?.id) && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Comment body or edit form */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full text-sm border border-indigo-300 rounded-lg p-2 outline-none resize-none focus:ring-2 focus:ring-indigo-200"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditBody(comment.body) }}
                className="text-xs border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
        )}

        {/* Reply button — only on root level comments to avoid deep nesting */}
        {depth === 0 && !isEditing && (
          <button
            onClick={() => onReply(comment.id)}
            className="mt-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
          >
            ↩ Reply
          </button>
        )}
      </div>

      {/* Render replies recursively */}
      {comment.replies?.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onDelete={onDelete}
          onEdit={onEdit}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

// ── MAIN COMMENTS SECTION ─────────────────────────────────────────

interface Props {
  taskId: number
}

const CommentsSection: React.FC<Props> = ({ taskId }) => {
  const [comments, setComments]     = useState<Comment[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [newBody, setNewBody]       = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch comments when component mounts
  const loadComments = useCallback(async () => {
    try {
      const res = await commentApi.list(taskId)
      setComments(res.data.data)
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    const fetchComments = async () => {
      await loadComments()
    }

    fetchComments()
  }, [loadComments])

  // Submit new comment or reply
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBody.trim()) return

    setIsSubmitting(true)
    try {
      await commentApi.create(taskId, newBody, replyingTo ?? undefined)
      setNewBody('')
      setReplyingTo(null)
      await loadComments()   // Refresh to get the new comment with author data
    } catch {
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete a comment
  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await commentApi.delete(id)
      await loadComments()
      toast.success('Comment deleted')
    } catch {
      toast.error('Delete failed')
    }
  }, [loadComments])

  // Update comment text locally (no need to refetch)
  const handleEdit = useCallback((id: number, body: string) => {
    setComments(prev =>
      prev.map(c => {
        if (c.id === id) return { ...c, body }
        // Also update in replies
        return {
          ...c,
          replies: c.replies?.map(r => r.id === id ? { ...r, body } : r) ?? [],
        }
      })
    )
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Comments
        </h4>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          {comments.length}
        </span>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-1 mb-4 max-h-72 overflow-y-auto pr-1">
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              onReply={setReplyingTo}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">

        {/* Show "Replying to #id" when replying */}
        {replyingTo && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
            <span>↩ Replying to comment #{replyingTo}</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="ml-auto text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        )}

        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />

        <button
          type="submit"
          disabled={isSubmitting || !newBody.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Posting…' : replyingTo ? '↩ Post Reply' : 'Post Comment'}
        </button>
      </form>
    </div>
  )
}

export default CommentsSection