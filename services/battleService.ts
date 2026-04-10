import { supabase } from '@/lib/supabase';
import type { Battle, CreateBattleInput, PickedImage } from '@/types';

function generateToken(): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getContentType(image: PickedImage): string {
  if (image.mimeType) return image.mimeType;

  return 'image/jpeg';
}

function getFileExtension(contentType: string): string {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
    case 'image/heif':
      return 'heic';
    default:
      return 'jpg';
  }
}

async function uploadImage(
  image: PickedImage,
  bucket: string,
  path: string
): Promise<string> {
  const contentType = getContentType(image);
  const fileBody = image.base64Data
    ? decodeBase64(image.base64Data)
    : await readFileBody(image.uri);

  const { error } = await supabase.storage.from(bucket).upload(path, fileBody, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function readFileBody(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

function decodeBase64(base64: string): Uint8Array {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleaned = base64.replace(/=+$/, '');
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i += 4) {
    const c1 = chars.indexOf(cleaned[i] ?? 'A');
    const c2 = chars.indexOf(cleaned[i + 1] ?? 'A');
    const c3 = chars.indexOf(cleaned[i + 2] ?? 'A');
    const c4 = chars.indexOf(cleaned[i + 3] ?? 'A');

    const n = (c1 << 18) | (c2 << 12) | ((Math.max(c3, 0)) << 6) | Math.max(c4, 0);

    bytes.push((n >> 16) & 255);
    if (cleaned[i + 2] !== undefined) bytes.push((n >> 8) & 255);
    if (cleaned[i + 3] !== undefined) bytes.push(n & 255);
  }

  return Uint8Array.from(bytes);
}

export async function createBattle(input: CreateBattleInput): Promise<Battle> {
  const token = generateToken();
  const timestamp = Date.now();
  const imageAType = getContentType(input.imageA);
  const imageBType = getContentType(input.imageB);

  const [imageAUrl, imageBUrl] = await Promise.all([
    uploadImage(
      input.imageA,
      'battle-images',
      `${token}/a_${timestamp}.${getFileExtension(imageAType)}`
    ),
    uploadImage(
      input.imageB,
      'battle-images',
      `${token}/b_${timestamp}.${getFileExtension(imageBType)}`
    ),
  ]);

  const { data, error } = await supabase
    .from('battles')
    .insert({
      creator_user_id: input.creatorUserId ?? null,
      title: input.title ?? null,
      invite_token: token,
      image_a_url: imageAUrl,
      image_b_url: imageBUrl,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create battle: ${error.message}`);

  // TODO: KPI - battle_created event { battle_id: data.id, token }

  return data as Battle;
}

export async function getBattle(battleId: string): Promise<Battle> {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('id', battleId)
    .single();

  if (error) throw new Error(`Battle not found: ${error.message}`);
  return data as Battle;
}

export async function getBattleByToken(token: string): Promise<Battle> {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('invite_token', token)
    .single();

  if (error) throw new Error(`Battle not found for token: ${error.message}`);
  return data as Battle;
}

export async function getBattlesByIds(battleIds: string[]): Promise<Battle[]> {
  if (battleIds.length === 0) return [];

  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .in('id', battleIds);

  if (error) throw new Error(`Failed to load battles: ${error.message}`);

  const byId = new Map((data ?? []).map((battle) => [battle.id, battle as Battle]));
  return battleIds.map((id) => byId.get(id)).filter((battle): battle is Battle => !!battle);
}
