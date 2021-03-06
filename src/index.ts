import fetch from 'node-fetch';

interface Response {
    results: Results;
    status: string;
}

interface Results {
    sunrise: string;
    sunset: string;
    solar_noon: string;
    day_length: number;
    civil_twilight_begin: string;
    civil_twilight_end: string;
    nautical_twilight_begin: string;
    nautical_twilight_end: string;
    astronomical_twilight_begin: string;
    astronomical_twilight_end: string;
}

interface Coordinate {
    lat: string;
    long: string;
}

const SECONDS_IN_HOUR = 3600;
const HOUR_PRECISION = 1;
const COORDINATE_PRECISION = 7;
const COORDINATE_QUANTITY = 100;
const PARALLEL_CALLS = 5;

async function displayResult(): Promise<void> {
    const data = await findDataWithEarliestSunrise();
    const dayLength = convertSecondsToHours(data.results.day_length);

    console.log(`Earliest sunrise day length: ${dayLength} hours`);
}

async function findDataWithEarliestSunrise(): Promise<Response> {
    const twilightData = await fetchTwilightData();

    // The api is returning the unix epoch for all fields for some generated coordinates.
    // I decided it would just be best to filter them out for now.
    const sortedData = twilightData
        .filter((data) => data.results.day_length > 0)
        .sort((a, b) => a.results.sunrise.localeCompare(b.results.sunrise));

    return sortedData[0];
}

async function fetchTwilightData(): Promise<Response[]> {
    const coordinates = generateCoordinates(COORDINATE_QUANTITY);
    const data: Response[] = [];

    for (let i = 0; i < coordinates.length; i += PARALLEL_CALLS) {
        const coordinatesToFetch = coordinates.slice(i, i + PARALLEL_CALLS);

        const promises = coordinatesToFetch.map(({lat, long}) => fetch(`https://api.sunrise-sunset.org/json?lat=${lat}lng=${long}&formatted=0`));
        const responses = await Promise.all(promises);
        const toJsonPromises = responses.map((response) => response.json() as Promise<Response>);

        data.push(...await Promise.all(toJsonPromises));
    }

    return data;
}

function generateCoordinates(quantity: number): Coordinate[] {
    const coordinates: Coordinate[] = [];

    for (let i = 0; i < quantity; i++) {
        const lat = randomCoordinateFromRange(-90, 90);
        const long = randomCoordinateFromRange(-180, 180);

        coordinates.push({lat, long});
    }

    return coordinates;
}

function randomCoordinateFromRange(min: number, max: number): string {
    return (Math.random() * (max - min) + min).toFixed(COORDINATE_PRECISION);
}

function convertSecondsToHours(seconds: number): string {
    return (seconds / SECONDS_IN_HOUR).toFixed(HOUR_PRECISION);
}

console.log('Fetching results please wait...');
await displayResult();