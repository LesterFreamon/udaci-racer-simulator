// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
    track_id: undefined,
    player_id: undefined,
    race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    onPageLoad()
    setupClickHandlers()
})

async function onPageLoad() {
   try {
        const tracks = await getTracks();
        renderAt('#tracks', renderTrackCards(tracks));

        const racers = await getRacers();
        renderAt('#racers', renderRacerCars(racers));

    } catch (error) {
        console.error("Problem getting tracks and racers:", error.message);
    }
}

function setupClickHandlers() {
    document.addEventListener('click', function (event) {
        const {target} = event

        // Race track form field
        if (target.matches('.card.track')) {
            handleSelectTrack(target)
        }

        // Podracer form field
        if (target.matches('.card.podracer')) {
            handleSelectPodRacer(target)
        }

        // Submit create race form
        if (target.matches('#submit-create-race')) {
            event.preventDefault()

            // start race
            handleCreateRace()
        }

        // Handle acceleration click
        if (target.matches('#gas-peddle')) {
            handleAccelerate()
        }

    }, false)
}

async function delay(ms) {
    try {
        return await new Promise(resolve => setTimeout(resolve, ms));
    } catch (error) {
        console.log("an error shouldn't be possible here")
        console.log(error)
    }
}

// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
    const playerID = store.player_id;
    const trackID = store.track_id;
    if (!playerID || !trackID) {
        alert("Please select a player and track");
        return;
    }
    try {
        const race = await createRace(playerID, trackID);
        // For the API to work properly, the race id should be race id - 1
        store.race_id = race.ID - 1;
        renderAt('#race', renderRaceStartView(race.Track, race.Cars))
        // The race has been created, now start the countdown
        await runCountdown();
        await startRace(store.race_id);
        await runRace(store.race_id);
    } catch (error) {
        console.error("There was an error:", error);
    }
}

function runRace(raceID) {
    return new Promise((resolve, reject) => {
        const raceInterval = setInterval(async () => {
            try {
                const race = await getRace(raceID);

                if (race.status === "in-progress") {
                    renderAt('#leaderBoard', raceProgress(race.positions));
                } else if (race.status === "finished") {
                    clearInterval(raceInterval);
                    renderAt('#race', raceProgress(race.positions));
                    resolve(race);
                } else {
                    clearInterval(raceInterval);
                    resolve(race);
                }
            }
            catch (error) {
                console.error("There was an error during race progression:", error.message);
                clearInterval(raceInterval);
                reject(error);
            }
        }, 500);
    });
}

async function runCountdown() {
    try {
        // wait for the DOM to load
        await delay(400)
        let timer = 3

        return new Promise(resolve => {
            // run this DOM manipulation to decrement the countdown for the user
            document.getElementById('big-numbers').innerHTML = timer

            const interval = setInterval(() => {
                // Decrement the timer
                timer--;

                // Update the countdown for the user
                document.getElementById('big-numbers').innerHTML = timer;

                // If the countdown is done
                if (timer === 0) {
                    // Clear the interval
                    clearInterval(interval);
                    // Resolve the promise
                    resolve();
                }
            }, 400);

        })
    } catch (error) {
        console.log(error);
    }
}


function handleSelectPodRacer(target) {

    // remove class selected from all racer options
    const selected = document.querySelector('#racers .selected')
    if (selected) {
        selected.classList.remove('selected')
    }

    // add class selected to current target
    target.classList.add('selected')

    store.player_id = target.id;
    console.log("selected a racer", store.player_id)

}

function handleSelectTrack(target) {

    // remove class selected from all track options
    const selected = document.querySelector('#tracks .selected')
    if (selected) {
        selected.classList.remove('selected')
    }

    // add class selected to current target
    target.classList.add('selected')

    store.track_id = target.id;
    console.log("selected a track", store.track_id);

}

function handleAccelerate() {
    console.log("accelerate button clicked")
    // TODO - Invoke the API call to accelerate
    accelerate(store.race_id)
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
    if (!racers.length) {
        return `
			<h4>Loading Racers...</4>
		`
    }

    const results = racers.map(renderRacerCard).join('')

    return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
    const {id, driver_name, top_speed, acceleration, handling} = racer

    return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
    if (!tracks.length) {
        return `
			<h4>Loading Tracks...</4>
		`
    }

    const results = tracks.map(renderTrackCard).join('')

    return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
    const {id, name} = track

    return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
    return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
    return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
    positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

    return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
    let userPlayer = positions.find(e => e.id === store.player_id)
    userPlayer.driver_name += " (you)"

    positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
    let count = 1

    const results = positions.map(p => {
        return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
    })

    return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
    const node = document.querySelector(element)

    node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001'

function defaultFetchOpts() {
    return {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': SERVER,
        },
    }
}

function getTracks() {
    // GET request to `${SERVER}/api/tracks`
    return fetch(`${SERVER}/api/tracks`)
        .then(data => data.json())
        .catch(error => console.log('Error with getTracks request::', error));
}

function getRacers() {
    // GET request to `${SERVER}/api/cars`
    return fetch(`${SERVER}/api/cars`)
        .then(data => data.json())
        .catch(error => console.log('Error with getRacers request::', error))
}

function createRace(player_id, track_id) {
    player_id = parseInt(player_id)
    track_id = parseInt(track_id)
    const body = {player_id, track_id}

    return fetch(`${SERVER}/api/races`, {
        method: 'POST',
        ...defaultFetchOpts(),
        dataType: 'jsonp',
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
    // GET request to `${SERVER}/api/races/${id}`
    return fetch(`${SERVER}/api/races/${id}`)
        .then(data => data.json())
        .catch(err => console.log("Problem with getRace request::", err))
}

function startRace(id) {
    return fetch(`${SERVER}/api/races/${id}/start`, {
        method: 'POST',
        ...defaultFetchOpts(),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();  // read body as text
        })
        .then(text => {
            if (text) {
                // If there's text, attempt to parse it as JSON
                return JSON.parse(text);
            } else {
                // If there's no text, return an empty object or handle accordingly
                return {};
            }
        })
        .catch(err => console.log("Problem with getRace request::", err));
}

function accelerate(id) {
    // POST request to `${SERVER}/api/races/${id}/accelerate`
    // options parameter provided as defaultFetchOpts
    // no body or datatype needed for this request
    return fetch(`${SERVER}/api/races/${id}/accelerate`, {
        method: 'POST',
        ...defaultFetchOpts()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Acceleration request was not successful');
        }
        return response.json();
    })
    .then(data => {
        console.log("Acceleration response:", data);
    })
    .catch(error => console.error("Problem with accelerate request:", error))
}