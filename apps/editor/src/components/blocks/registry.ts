import { ButtonBlock } from "./Button";
import { CardBlock } from "./Card";
import { ChartBlock } from "./Chart";
import { FormBlock } from "./Form";
import { GalleryBlock } from "./Gallery";
import { ImageBlock } from "./Image";
import { TableBlock } from "./Table";
import { TextBlock } from "./Text";
import { VideoBlock } from "./Video";

export const blockRegistry = {
  text: TextBlock,
  image: ImageBlock,
  button: ButtonBlock,
  card: CardBlock,
  gallery: GalleryBlock,
  video: VideoBlock,
  table: TableBlock,
  chart: ChartBlock,
  form: FormBlock
} as const;

export function hasBlockRenderer(value: string): value is keyof typeof blockRegistry {
  return value in blockRegistry;
}
