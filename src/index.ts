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

const COORDINATE_PRECISION = 7;
const COORDINATE_QUANTITY = 100;

const PARALLEL_CALLS = 5

async function displayResult(): Promise<void> {
    const data = await findDataWithEarliestSunrise();
    const dayLength = convertSecondsToHours(data.results.day_length);

    console.log(`Earliest sunrise day length: ${dayLength} hours`)
}

async function findDataWithEarliestSunrise(): Promise<Response> {
    const data = await fetchTwilightData();

    return data.reduce((previousData, currentData) => {
        const { sunrise: earliestSunrise } = previousData.results;
        const { sunrise, day_length: dayLength } = currentData.results;

        return dayLength === 0 || earliestSunrise < sunrise ? previousData : currentData
    });
}

async function fetchTwilightData(): Promise<Response[]> {
    const coordinates = generateCoordinates(COORDINATE_QUANTITY);
    const data: Response[] = [];

    for (let i = 0; i < coordinates.length; i += PARALLEL_CALLS) {
        const coordinatesToFetch = coordinates.slice(i, i + PARALLEL_CALLS)

        const promises = coordinatesToFetch.map(async ({lat, long}) => {
            const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}lng=${long}&formatted=0`)

            return (await res.json()) as Response;
        })

        data.push(...await Promise.all(promises))
    }

    return data
}

function generateCoordinates(quantity: number): Coordinate[] {
    const coordinates: Coordinate[] = [];

    for (let i = 0; i < quantity; i++) {
        const lat = randomCoordinateFromRange(-90, 90);
        const long = randomCoordinateFromRange(-180, 180);

        coordinates.push({lat, long})
    }

    return coordinates
}

function randomCoordinateFromRange(min: number, max: number): string {
    return (Math.random() * (max - min) + min).toFixed(COORDINATE_PRECISION);
}

function convertSecondsToHours(seconds: number): string {
    return (seconds / 3600).toFixed(1);
}

console.log('Fetching results please wait...')
console.log(await displayResult())