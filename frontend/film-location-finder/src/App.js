import React from 'react';
import {APIProvider, Map, useMapsLibrary, useMap} from '@vis.gl/react-google-maps';
import {useState, useEffect, useMemo} from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { debounce } from '@mui/material/utils';

import './App.css';

/*function geocode(address) {
  const maps = useMapsLibrary();
  const geocoder = new maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({address}, (results, status) => {
      if (status === 'OK') {
        resolve(results[0].geometry.location);
      } else {
        reject(status);
      }
    });
  });
}*/
export const MyComponent = () => {
  const map = useMap('main-map');
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
    
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

  

  const geocodingLib = useMapsLibrary('geocoding');
  const geocoder = useMemo(
    () => geocodingLib && new geocodingLib.Geocoder(),
    [geocodingLib]
  );

  useEffect(() => {
    if (!geocoder) return;
      console.log('geocoder loaded');
    // now you can use `geocoder.geocode(...)` here
  }, [geocoder]);

  
  //search for movie
  useEffect(() => {
    let active = true;
    const canSearch = value ? value.Title !== inputValue : true;

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }else if(canSearch){
      search({ input: inputValue }, (results) => {
        if (active) {
          let newOptions = [];
  
          if (value) {
            newOptions = [value];
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
    if (value) {
      fetch(`http://localhost:3100/api/movie/${value.imdbID}`)
        .then(response => response.json())
        .then(data => {
          geocoder.geocode({address: data[0].location}).then((results, status) => {
            console.log(results);
            if (status === 'OK') {

            } else {
              console.log(status);
            }
          });
          
        });
    }
  }, [value]);

  return (
    <div className="z-10 absolute p-3 top-4 left-4 w-80 bg-white leading-loose rounded border-gray-600 border-2">
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
        value={value}
        noOptionsText=""
        openOnFocus={false}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params) => (
          <TextField {...params} label="Search a movie" fullWidth />
        )}
        renderOption={(props, option) => {
          const { key,  ...optionProps } = props;
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
  

  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_API}>
      <Map id={'main-map'}
        style={{width: '100vw', height: '100vh'}}
        defaultCenter={{lat: 38.28241100742082, lng: -96.99544191519968}}
        defaultZoom={5}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        colorScheme='DARK'
      ></Map>
      <MyComponent></MyComponent>
    </APIProvider>
  )
};

export default App;
