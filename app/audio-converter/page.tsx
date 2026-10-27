import type { Metadata } from 'next';
import { HubView, getHubMetadata } from '@/components/hub/HubView';

export const metadata: Metadata = getHubMetadata('audio');

export default function AudioConverterPage() {
  return <HubView dept="audio" />;
}
