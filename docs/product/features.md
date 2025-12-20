# Feature Reference

## Homepage / Discovery
The main entry point for users.
- **Contest Grid**: Cards displaying key info (Title, Platform, Status, Tags).
- **Filters**:
    - **Status**: Active, Upcoming, Ended.
    - **Category**: Vision, Audio, Text, etc.
    - **Sort**: Newest, Ending Soon, Most Prize.
- **Search**: Real-time text search in titles and descriptions.

## Contest Details
A dedicated page for each contest.
- **AI Summary**: Quick overview of the challenge.
- **Original Description**: Full text from the source.
- **Metadata**: Deadlines, Prizes, Requirements.
- **Link**: Direct button to the official contest page.

## API Access
Developers can access the processed data.
- **Endpoint**: `/api/contests`
- **Format**: JSON
- **Fields**: Standardized contest object.

## CLI Tools
Command-line interface for administrators.
- `crawl`: Trigger manual scraping.
- `process`: Trigger AI processing.
- `validate`: Check data integrity.
