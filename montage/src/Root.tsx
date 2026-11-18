import { Composition } from "remotion";
import { Montage } from "./Montage";
import { FPS, TOTAL } from "./timeline";

export const Root = () => (
  <Composition id="Montage" component={Montage} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);
