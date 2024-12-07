import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { debounce } from '@mui/material/utils';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import React, { useEffect, useMemo, useState } from 'react';

import './App.css';
import { LoadingSpinner } from './loading-spinner';
import { MarkerWithInfowindow } from './marker-with-infowindow';

export const MyComponent = (props) => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [pendingGeocodes, setPendingGeocodes] = useState([]);
  const geocodingLib = useMapsLibrary('geocoding');
  const map = useMap('main-map');

  const geocoder = useMemo(
    () => geocodingLib && new geocodingLib.Geocoder(),
    [geocodingLib]
  );

  useEffect(() => {
    if (!geocoder) return;
    console.log('geocoder loaded');
    // now you can use `geocoder.geocode(...)` here
  }, [geocoder]);

  const search = useMemo(
    () =>
      debounce((request, callback) => {
        //autocompleteService.current.getPlacePredictions(request, callback);
        fetch("http://localhost:3100/api/search?title=" + encodeURIComponent(request.input))
          .then(response => response.json())
          .then(data => callback(data.Search));
      }, 1000),
    [],
  );

  //search for movie
  useEffect(() => {
    let active = true;
    const canSearch = selectedMovie ? selectedMovie.Title !== inputValue : true;

    if (inputValue === '') {
      setOptions(selectedMovie ? [selectedMovie] : []);
      return undefined;
    } else if (canSearch) {
      search({ input: inputValue }, (results) => {
        if (active) {
          let newOptions = [];

          if (selectedMovie) {
            newOptions = [selectedMovie];
          }

          if (results) {
            newOptions = [...newOptions, ...results];
          }

          setOptions(newOptions);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [inputValue, search]);

  //selected movie, get locations
  useEffect(() => {
    if (selectedMovie) {
      props.onLoadingData(true);

      fetch(`http://localhost:3100/api/movie/${selectedMovie.imdbID}`)
        .then(response => response.json())
        .then(data => {
          if (data.length > 0) {
            setPendingGeocodes(data);
          }
          else {
            props.onLoadingData(false);
            console.log('no filming locations found');
          }
        }).catch(error => { props.onLoadingData(false); console.log(error) });
    }
  }, [selectedMovie]);

  //geocode locations
  useEffect(() => {
    async function geocodeFilmLocations() {
      if (pendingGeocodes && pendingGeocodes.length > 0) {
        try {
          let newMarkers = [];

          for (let i = 0; i < pendingGeocodes.length; i++) {
            const result = await geocoder.geocode({ address: pendingGeocodes[i].location });
            if (result && result?.results && result?.results.length > 0) {
              if (result.results[0].types.indexOf('political') === -1) { //ignore generic city/country locations
                newMarkers.push({
                  lat: result.results[0].geometry.location.lat(),
                  lng: result.results[0].geometry.location.lng(),
                  desc: pendingGeocodes[i].desc,
                  location: pendingGeocodes[i].location,
                  movieId: selectedMovie.imdbID,
                  movieTitle: selectedMovie.Title
                });
              }
            }
          }
          props.onGeocode(newMarkers);
          let north = 0, south = 90, east = -180, west = 0;

          newMarkers.forEach(marker => {
            if (marker.lat < south) south = marker.lat;
            if (marker.lat > north) north = marker.lat;

            if (marker.lng > east) east = marker.lng;
            if (marker.lng < west) west = marker.lng;
          });
          map.fitBounds({ north, south, east, west });
          props.onLoadingData(false);
        }
        catch (error) {
          props.onLoadingData(false);
          console.log(error);
        }
      }
    }
    geocodeFilmLocations();
  }, [pendingGeocodes]);

  return (
    <div className="z-50 absolute p-3 top-4 left-4 w-80 bg-white leading-loose rounded border-gray-600 border-2">
      <Autocomplete
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.Title
        }
        filterOptions={(x) => x}
        options={options}
        blurOnSelect
        autoComplete
        freeSolo
        includeInputInList={false}
        filterSelectedOptions
        value={selectedMovie}
        noOptionsText=""
        openOnFocus={false}
        onChange={(event, newValue) => {
          setSelectedMovie(newValue);
        }}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params) => (
          <TextField {...params} label="Search a movie" fullWidth />
        )}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return (
            <li key={option.imdbID} {...optionProps}>
              <img height="32" width="32" src={option.Poster != 'N/A' ? option.Poster : '/reel.jpg'}></img><span className='ml-1'>{option.Title} - ({option.Year})</span>
            </li>
          );
        }}
      />
    </div>

  );

};


export const App = () => {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);

  const setDataLoading = (dataLoading) => {
    setLoading(dataLoading);
  };

  const setChildGeocodeData = (markerInfo) => {
    setMarkers(markerInfo);
  };

  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_API} libraries={['marker']}>
      <Map id={'main-map'}
        style={{ width: '100vw', height: '100vh' }}
        defaultCenter={{ lat: 38.28241100742082, lng: -96.99544191519968 }}
        defaultZoom={5}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        colorScheme='DARK'
      >
        {markers && markers.length > 0 && markers.map((marker, index) => {
          return <MarkerWithInfowindow key={index} info={marker}></MarkerWithInfowindow>
        })}

      </Map>
      {loading ? <LoadingSpinner /> : null}
      <MyComponent onLoadingData={setDataLoading} onGeocode={setChildGeocodeData}></MyComponent>
    </APIProvider>
  )
};

export default App;
