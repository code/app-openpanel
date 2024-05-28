'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useFullscreen } from '@/components/fullscreen-toggle';
import { Tooltiper } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import { bind } from 'bind-event-listener';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';

import type { Coordinate } from './coordinates';
import {
  calculateGeographicMidpoint,
  clusterCoordinates,
  getAverageCenter,
  getOuterMarkers,
} from './coordinates';
import {
  CustomZoomableGroup,
  determineZoom,
  GEO_MAP_URL,
  getBoundingBox,
  useAnimatedState,
} from './map.helpers';
import { calculateMarkerSize } from './markers';

type Props = {
  markers: Coordinate[];
};
const Map = ({ markers }: Props) => {
  const [isFullscreen] = useFullscreen();
  const showCenterMarker = false;
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  // const { markers, toggle } = useActiveMarkers(_m);
  const hull = getOuterMarkers(markers);
  const center =
    hull.length < 2
      ? getAverageCenter(markers)
      : calculateGeographicMidpoint(hull);
  const boundingBox = getBoundingBox(hull);
  const [zoom] = useAnimatedState(
    markers.length === 1
      ? 20
      : determineZoom(boundingBox, size ? size?.height / size?.width : 1)
  );

  const [long] = useAnimatedState(center.long);
  const [lat] = useAnimatedState(center.lat);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (ref.current) {
        setSize({
          width: ref.current.clientWidth,
          height: ref.current.clientHeight,
        });
      }
    });
  }, [isFullscreen]);

  useEffect(() => {
    return bind(window, {
      type: 'resize',
      listener() {
        if (ref.current) {
          setSize({
            width: ref.current.clientWidth,
            height: ref.current.clientHeight,
          });
        }
      },
    });
  }, []);

  const adjustSizeBasedOnZoom = (size: number) => {
    const minMultiplier = 1;
    const maxMultiplier = 7;

    // Linearly interpolate the multiplier based on the zoom level
    const multiplier =
      maxMultiplier - ((zoom - 1) * (maxMultiplier - minMultiplier)) / (20 - 1);

    return size * multiplier;
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 top-0',
        !isFullscreen && 'top-16 lg:left-72'
      )}
      ref={ref}
    >
      {size === null ? (
        <></>
      ) : (
        <>
          <ComposableMap
            width={size?.width}
            height={size?.height}
            projection="geoMercator"
            projectionConfig={{
              rotate: [0, 0, 0],
              scale: 100 * 20,
            }}
          >
            <CustomZoomableGroup zoom={zoom * 0.06} center={[long, lat]}>
              <Geographies geography={GEO_MAP_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#EAEAEC"
                      stroke="black"
                      pointerEvents={'none'}
                    />
                  ))
                }
              </Geographies>
              {showCenterMarker && (
                <Marker coordinates={[center.long, center.lat]}>
                  <circle
                    r={adjustSizeBasedOnZoom(30)}
                    fill="green"
                    stroke="#fff"
                    strokeWidth={adjustSizeBasedOnZoom(2)}
                  />
                </Marker>
              )}
              {clusterCoordinates(markers).map((marker) => {
                const size = adjustSizeBasedOnZoom(
                  calculateMarkerSize(marker.count)
                );
                const coordinates: [number, number] = [
                  marker.center.long,
                  marker.center.lat,
                ];
                return (
                  <Fragment key={coordinates.join('-')}>
                    <Marker coordinates={coordinates}>
                      <circle
                        r={size}
                        fill="#2463EB"
                        className="animate-ping opacity-20"
                      />
                    </Marker>
                    <Tooltiper asChild content={`${marker.count} visitors`}>
                      <Marker coordinates={coordinates}>
                        <circle r={size} fill="#2463EB" fillOpacity={0.5} />
                      </Marker>
                    </Tooltiper>
                  </Fragment>
                );
              })}
            </CustomZoomableGroup>
          </ComposableMap>
        </>
      )}
      {/* <Button
        className="fixed bottom-[100px] left-[320px] z-50 opacity-0"
        onClick={() => {
          toggle();
        }}
      >
        Toogle
      </Button> */}
    </div>
  );
};

export default Map;
