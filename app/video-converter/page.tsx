import type { Metadata } from 'next';
import { HubView, getHubMetadata } from '@/components/hub/HubView';

export const metadata: Metadata = getHubMetadata('video');

export default function VideoConverterPage() {
  return <HubView dept="video" />;
}
