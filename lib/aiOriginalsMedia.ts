export type MediaAttachmentSource = {
  id: string
  type: 'image' | 'video'
  title: string
  sourcePath: string
  description?: string
}

export type MediaAttachment = {
  id: string
  type: 'image' | 'video'
  title: string
  url: string
  description?: string
}

export const AI_ORIGINALS_MEDIA: Record<string, MediaAttachmentSource[]> = {
  glitch_noir_serial: [
    {
      id: 'nyx_hacking_pose_20250625_091036',
      type: 'image',
      title: 'Nyx hacking pose — emotion rig frame',
      sourcePath: '/Users/hretheum/dev/bezrobocie/serial/generated_images/emotions_locations/completed/nyx_hacking_pose_20250625_091036.png',
      description: 'Generated still showing Nyx splicing the Ouroboros datastream.',
    },
    {
      id: 'varick_static_closeup_20250625_072000',
      type: 'video',
      title: 'Varick static close-up (MiniMax render)',
      sourcePath: '/Users/hretheum/dev/bezrobocie/serial/generated_videos/episode_downloads/varick_static_closeup_20250625_072000.mp4',
      description: 'Hero close-up rendered via MiniMax Hailuo-02 with noir lighting.',
    },
    {
      id: 'varick_crane_down_20250625_072820',
      type: 'video',
      title: 'Varick crane-down establishing shot',
      sourcePath: '/Users/hretheum/dev/bezrobocie/serial/generated_videos/first_frame_tests/completed/varick_crane_down_20250625_072820.mp4',
      description: 'Camera crane descent aligning skyline parallax with synthwave palette.',
    },
    {
      id: 'varick_zoom_out_reveal_20250625_072835',
      type: 'video',
      title: 'Varick zoom-out reveal',
      sourcePath: '/Users/hretheum/dev/bezrobocie/serial/generated_videos/first_frame_tests/completed/varick_zoom_out_reveal_20250625_072835.mp4',
      description: 'Zoom-out hero reveal synchronised with lip-sync pass.',
    },
    {
      id: 'test_minimax_hailuo_02_20250624_160821',
      type: 'video',
      title: 'MiniMax Hailuo-02 motion stress test',
      sourcePath: '/Users/hretheum/dev/bezrobocie/serial/generated_videos/tests/test_MiniMax_Hailuo_02_20250624_160821.mp4',
      description: 'First motion stress test verifying upscale fidelity before rollout.',
    },
  ],
}

export function getMediaAttachments(slug: string): MediaAttachment[] {
  const sources = AI_ORIGINALS_MEDIA[slug] ?? []
  const baseUrl = `/api/ai-originals/media/${slug}`

  return sources.map((source) => ({
    id: source.id,
    type: source.type,
    title: source.title,
    url: `${baseUrl}/${source.id}`,
    description: source.description,
  }))
}

export function resolveMediaSource(slug: string, id: string): MediaAttachmentSource | undefined {
  const sources = AI_ORIGINALS_MEDIA[slug]
  if (!sources) return undefined
  return sources.find((source) => source.id === id)
}
