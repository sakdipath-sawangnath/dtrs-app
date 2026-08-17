/** Jest mock for ESM `file-type` — inspects magic bytes used in upload tests */
export const HEIC_MARKER = Buffer.from('ftypheic');

export async function fileTypeFromBuffer(
  buffer: Uint8Array | ArrayBuffer | Buffer,
): Promise<{ mime: string; ext: string } | undefined> {
  const buf = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer as Uint8Array);
  if (
    buf.length >= 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff
  ) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (buf.includes(Buffer.from('WEBP'))) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (buf.includes(HEIC_MARKER) || buf.includes(Buffer.from('ftypheif'))) {
    return { mime: 'image/heic', ext: 'heic' };
  }
  if (buf.length >= 4 && buf.subarray(0, 3).toString('ascii') === 'GIF') {
    return { mime: 'image/gif', ext: 'gif' };
  }
  return undefined;
}
