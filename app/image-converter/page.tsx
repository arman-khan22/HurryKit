import type { Metadata } from 'next';
import { HubView, getHubMetadata } from '@/components/hub/HubView';

export const metadata: Metadata = getHubMetadata('image');

export default function ImageConverterPage() {
  return <HubView dept="image" />;
}
