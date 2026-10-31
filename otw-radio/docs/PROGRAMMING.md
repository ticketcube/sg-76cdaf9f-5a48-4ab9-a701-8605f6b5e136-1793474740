# OTW Radio programming

The machine-readable version is `config/schedule.json`. Change the grid there and both the sync service and the site follow.

## Daily grid (every day, station time zone America/New_York, to confirm)

| Time | Block | How it airs |
| --- | --- | --- |
| 00:00 to 10:00 | OTW Playlist | AzuraCast default rotation, shuffled |
| 10:00 to 12:00 | OTW Weekly Feature, premiere | Dated playlist from AIMC, plays once, interrupts rotation |
| 12:00 to 15:00 | Guest Curator Playlist | Dated playlist, plays once |
| 15:00 to 17:00 | OTW Weekly Feature, repeat | Same dated playlist as 10:00 |
| 17:00 to 24:00 | OTW Playlist | Rotation |

If a feature or curator block runs short, or no episode file exists for the day, the OTW Playlist rotation fills the rest of the slot automatically.

## Weekly features

| Day | Feature | Notes |
| --- | --- | --- |
| Monday | OTW Weekly Recap | Produced each week |
| Tuesday | Chef's Choice | Format to confirm |
| Wednesday | OTW Touring Artists | AIMC performances and interviews of artists on tour that week. Tour dates can come from the Ticketmaster OTW roster feed |
| Thursday | GWLMMWLG | Format to confirm |
| Friday | Artist Interview | AIMC holds about 63 interview assets today (keyword search) |
| Saturday | Live From the Rooftop (proposed) | Existing OTW session series in AIMC |
| Sunday | Best of the Week (proposed) | Repeats of the weekday features |

## Live shows

Real live shows (studio or venue) come in through AzuraCast's live DJ input (Streamers) and take over whatever is scheduled. Venue shows follow the LiveNation.tv rule: no replay unless the artist opts in.

## Licensing rules that affect programming

The US statutory webcasting license allows, in any 3 hours, no more than 3 songs from one album (2 back to back) and no more than 4 by one artist (3 back to back), and no advance list of which song plays when. Artist-focused hours (Guest Curator, Touring Artists, artist takeovers) need a direct license from that artist and label, or a mixed playlist that stays within the limits. Recordings of interviews need a guest release on file.
