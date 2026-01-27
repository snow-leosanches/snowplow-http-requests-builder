# Snowplow HTTP Request Builder

A web-based tool for building and testing Snowplow HTTP tracking requests. This application provides an intuitive interface to construct properly formatted Snowplow pixel tracking URLs with support for all event types, self-describing events, and context entities.

## Features

- **Multiple Event Types**: Support for all Snowplow event types:
  - Page View (`pv`)
  - Page Ping (`pp`)
  - Transaction (`tr`)
  - Transaction Item (`ti`)
  - Structured Event (`se`)
  - Self-describing Event (`ue`)

- **Comprehensive Parameter Support**:
  - Application parameters (tracker namespace, app ID, platform, tracker version)
  - Timestamp parameters (device timestamp, sent timestamp, true timestamp, timezone)
  - User parameters (user ID, domain user ID, session ID, visit index, IP address)
  - Platform parameters (URL, user agent, page title, referrer, viewport, screen resolution, etc.)

- **Self-Describing Events**:
  - JSON Schema parsing and validation
  - Dynamic form generation based on schema properties
  - Automatic Base64 encoding with proper Snowplow wrapper schema
  - Support for nested objects and arrays

- **Context Entities**:
  - Multiple context entity support
  - JSON Schema parsing for each context
  - Proper Base64 encoding with Snowplow contexts wrapper schema
  - Searchable schema URI field with autocomplete suggestions
  - First 5 entities shown as autocomplete suggestions

- **Snowplow Data Structures API Integration**:
  - Connect to Snowplow Console API to fetch data structures
  - Automatic authentication with JWT token management
  - Searchable schema catalog with real-time filtering
  - Support for vendor, name, and format filtering

- **User Experience**:
  - Real-time URL generation
  - Field history/autocomplete for frequently used values
  - Copy-to-clipboard functionality
  - Schema validation with error messages
  - Clean, modern UI with Tailwind CSS
  - Searchable schema selection with autocomplete

## How It Works

The application builds Snowplow HTTP request URLs by:

1. **Collecting Parameters**: Users fill in form fields for various Snowplow parameters
2. **Schema Parsing**: For self-describing events and context entities, JSON schemas are parsed to generate dynamic form fields
3. **URL Construction**: The `buildSnowplowUrl` function constructs a properly formatted URL with:
   - Query parameters for standard fields
   - Base64-encoded JSON payloads for self-describing events (`ue_px`) and context entities (`cx`)
4. **Proper Encoding**: Self-describing events are wrapped with the root schema `iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0`, and context entities are wrapped with `iglu:com.snowplowanalytics.snowplow/contexts/jsonschema/1-0-0`

### Self-Describing Event Structure

Self-describing events are encoded as:
```json
{
  "schema": "iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0",
  "data": {
    "schema": "iglu:your-vendor/your-event/jsonschema/1-0-0",
    "data": { /* your event data */ }
  }
}
```

### Context Entities Structure

Context entities are encoded as:
```json
{
  "schema": "iglu:com.snowplowanalytics.snowplow/contexts/jsonschema/1-0-0",
  "data": [
    {
      "schema": "iglu:your-vendor/your-context/jsonschema/1-0-0",
      "data": { /* your context data */ }
    }
  ]
}
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd snowplow-http-requests-builder
```

2. Install dependencies:
```bash
npm install
```

### Running Locally

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

To build the application for production:

```bash
npm run build
```

The production build will be in the `dist` directory. You can preview it with:

```bash
npm run preview
```

## Development

### Project Structure

```
src/
  ├── components/                    # Reusable React components
  │   ├── SnowplowConfigurationPanel.tsx  # Snowplow API configuration
  │   ├── ContextEntitiesPanel.tsx        # Context entities management
  │   └── ...
  ├── routes/                        # Application routes (TanStack Router)
  ├── server/                         # TanStack Start server functions
  │   └── snowplowDataStructures.ts   # API integration (authentication, data fetching)
  ├── types/                          # TypeScript type definitions
  │   ├── snowplow.ts                 # Snowplow request types
  │   └── snowplowDataStructures.ts   # Data Structures API types
  ├── utils/                          # Utility functions
  │   ├── urlBuilder.ts               # URL construction logic
  │   ├── schemaParser.ts             # JSON Schema parsing
  │   ├── validation.ts               # Field validation
  │   ├── fieldHistory.ts             # Field history/autocomplete
  │   └── snowplowDataStructuresClient.ts  # Data Structures API client
  └── data/                           # Demo data and examples
```

### Key Utilities

- **`urlBuilder.ts`**: Core logic for building Snowplow URLs with proper parameter encoding
- **`schemaParser.ts`**: Parses JSON schemas to extract field definitions for dynamic form generation
- **`validation.ts`**: Validates form fields against schema requirements
- **`fieldHistory.ts`**: Manages field history for autocomplete functionality
- **`snowplowDataStructuresClient.ts`**: Client for Snowplow Data Structures API with automatic authentication and token management
- **`server/snowplowDataStructures.ts`**: Server-side functions for API calls (avoids CORS issues)

### Linting & Formatting

This project uses ESLint and Prettier for code quality:

```bash
npm run lint      # Check for linting errors
npm run format    # Format code with Prettier
npm run check     # Format and fix linting issues
```

### Testing

Tests can be run with:

```bash
npm run test
```

## Usage

1. **Set Collector URL**: Enter your Snowplow collector endpoint (default: `https://collector.snowplow.io/i`)

2. **Configure Snowplow Data Structures** (Optional but recommended):
   - Enter your **Organization ID** (UUID format)
   - Enter your **API Key** (required)
   - Enter your **API Key ID** (required)
   - Click **Refresh** to load available data structures from Snowplow Console
   - The application will automatically authenticate and store the JWT token

3. **Select Event Type**: Choose the type of event you want to track

4. **Fill Parameters**: Complete the relevant parameter fields for your event type

5. **For Self-Describing Events**:
   - Use the searchable schema URI field to find and select a schema from your data structures
   - Or manually paste a JSON Schema URI (e.g., `iglu:com.example/event/jsonschema/1-0-0`)
   - Or paste the full JSON Schema JSON
   - The form will automatically generate fields based on the schema properties
   - Fill in the generated fields

6. **For Context Entities**:
   - Click **Add Context Entity** to add a new context
   - Use the searchable **Schema URI** field:
     - When focused, the first 5 entities are shown as suggestions
     - Type to filter schemas by URI, name, vendor, or description
     - Select a schema from the dropdown to auto-populate the JSON Schema
   - Or manually enter a JSON Schema URI or JSON
   - Fill in the generated fields for each context

7. **Copy URL**: The generated URL is displayed in real-time. Click the copy button to copy it to your clipboard

8. **Test**: Use the generated URL in your browser or HTTP client to send the tracking request

## Technologies

- **React 19**: UI framework
- **TanStack Router**: File-based routing
- **TanStack Start**: Full-stack framework with server functions
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Vite**: Build tool and dev server
- **Nitro**: Server framework (configured but not actively used)

## Snowplow Data Structures API

This application integrates with the Snowplow Console Data Structures API to provide:

- **Automatic Schema Discovery**: Fetch and browse available data structures from your Snowplow organization
- **Searchable Schema Catalog**: Search schemas by URI, vendor, name, or description
- **Automatic Authentication**: JWT tokens are automatically managed and refreshed
- **CORS-Free Integration**: All API calls are made through server functions to avoid browser CORS restrictions

### API Configuration

To use the Data Structures API integration:

1. Obtain your **Organization ID** from Snowplow Console
2. Create an **API Key** and **API Key ID** in Snowplow Console
3. Enter these credentials in the **Snowplow Data Structures Configuration** panel
4. Click **Refresh** to load your data structures

The application will:
- Authenticate using the `/organizations/:organizationId/credentials/v3/token` endpoint
- Store the JWT access token in localStorage (with automatic expiry handling)
- Fetch data structures from `/organizations/:organizationId/data-structures/v1`
- Fetch schema content when you select a schema for use in events or contexts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
