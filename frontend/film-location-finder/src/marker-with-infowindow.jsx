import {
  InfoWindow,
  Marker,
  useMarkerRef
} from '@vis.gl/react-google-maps';
import React, { useState } from 'react';

export const MarkerWithInfowindow = (props) => {
  const [infowindowOpen, setInfowindowOpen] = useState(false);
  const [markerRef, marker] = useMarkerRef();

  return (
    <>
      <Marker
        ref={markerRef}
        onClick={() => setInfowindowOpen(true)}
        position={{ lat: props.info.lat, lng: props.info.lng }}
        title={props.info.desc}
      />
      {infowindowOpen && (
        <InfoWindow
          anchor={marker}
          //maxWidth={200}
          onCloseClick={() => setInfowindowOpen(false)}>
          <div id="content">
            <div><span class="text-base font-bold">Desc: </span><span class="text-base">{props.info.desc}</span></div>
            <div><span class="text-base font-bold">Location: </span><span class="text-base">{props.info.location}</span></div>
            <div><span class="text-base font-bold">Movie: </span><span class="text-base">{props.info.movieTitle}</span></div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};
