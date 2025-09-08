import type { 
  AnyMetadata, 
  ImageMetadata, 
  VideoMetadata, 
  MediaMetadata, 
  MarkdownMetadata,
  PostMention 
} from "@cartel-sh/ui";

// Metadata type guards
export function isImageMetadata(metadata: AnyMetadata): metadata is ImageMetadata {
  return 'image' in metadata && metadata.image != null;
}

export function isVideoMetadata(metadata: AnyMetadata): metadata is VideoMetadata {
  return 'video' in metadata && metadata.video != null;
}

export function isMediaMetadata(metadata: AnyMetadata): metadata is MediaMetadata {
  return 'attachments' in metadata && Array.isArray(metadata.attachments);
}

export function isMarkdownMetadata(metadata: AnyMetadata): metadata is MarkdownMetadata {
  return 'content' in metadata && typeof metadata.content === 'string' && 
         !('image' in metadata) && !('video' in metadata) && !('attachments' in metadata);
}

// PostMention type guards  
export function isAccountMention(mention: PostMention): mention is { account: string; namespace?: string; localName?: string; replace?: { from: string; to: string; } } {
  return 'account' in mention;
}

export function isGroupMention(mention: PostMention): mention is { group: string } {
  return 'group' in mention;
}

// Helper function to get media URL from any metadata type
export function getMediaUrl(metadata: AnyMetadata): string | undefined {
  if (isImageMetadata(metadata)) {
    return metadata.image?.item;
  }
  if (isVideoMetadata(metadata)) {
    return metadata.video?.item;
  }
  if (isMediaMetadata(metadata) && metadata.attachments.length > 0) {
    return metadata.attachments[0]?.item;
  }
  return undefined;
}

// Helper function to get media cover/thumbnail
export function getMediaCover(metadata: AnyMetadata): string | undefined {
  if (isImageMetadata(metadata)) {
    return metadata.image?.item;
  }
  if (isVideoMetadata(metadata)) {
    return metadata.video?.cover || metadata.video?.item;
  }
  if (isMediaMetadata(metadata) && metadata.attachments.length > 0) {
    return metadata.attachments[0]?.cover || metadata.attachments[0]?.item;
  }
  return undefined;
}