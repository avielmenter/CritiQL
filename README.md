# CritiQL
A GraphQL API for accessing [CritRoleStats](https://www.critrolestats.com/) data.

# About
CritiQL (pronounced "critical") is a [GraphQL](https://graphql.org/) API for querying CritRoleStats roll data. It allows users to query the CritRoleStats [Vox Machina](https://docs.google.com/spreadsheets/d/1OEg29XbL_YpO0m5JrLQpOPYTnxVsIg8iP67EYUrtRJg/edit) and [Mighty Nein](https://docs.google.com/spreadsheets/d/1FFuw5c6Hk1NUlHv2Wvr5b9AElLA51KtRl9ZruPU8r9k/edit#gid=0) spreadsheets using GraphQL.

Critters have [previously requested](https://www.critrolestats.com/blog/2017/10/19/quick-answers-58) an API, but CritRoleStats has so far declined to make one. Thankfully, Google exposes spreadsheet data through their own API, which CritiQL uses to download CritRoleStats' data and make it queryable via GraphQL.

Although CritiQL is not in active development, I am still happy to implement new features. If you think of any that you would like, feel free to ping or message `@avi#0885` on the [Critical Role Discord](https://www.reddit.com/r/criticalrole/comments/4a9jcs/no_spoilers_we_have_a_discord_server/).

CritiQL would not be possible without CritRoleStats' diligent and painstaking data gathering over the past several years. If you like this project, you can show your appreciation by going to the [CritRoleStats](https://www.critrolestats.com/) website and donating to them. 

## Try It!
You can write and run GraphQL queries against the CritiQL API [here](http://critiql.herokuapp.com/graphql).

# Setup

If you wish to download and run CritiQL yourself, you can do so by following these steps:

## Prerequisites
To run this project, you must already have downloaded and installed:
 - [Node.js](https://nodejs.org/en/)
 - [MongoDB](https://www.mongodb.com/)

## Installation

To install CritiQL, perform the following steps:

 1. Clone this repository using the command `git clone https://github.com/avielmenter/critiql.git`
 2. Navigate to the `critiql` folder.
 3. Run the command `npm install`.

## Environment Variables

To run this application, you must configure certain environment variables on your system:
 - `PORT`: The port on which the Node server will listen.
 - `CRITIQL_SHEETS_KEY`: The API key used to access the Google Sheets API.
 - `CRITIQL_DB_SERVER`: The URL of the MongoDB server CritiQL will use.
 - `CRITIQL_DB_PORT`: The port used to connect to the MongoDB server.
 - `CRITIQL_DB_SCHEMA`: The specific database on MongoDB used by the application.
 - `CRITIQL_DB_USER`: The name of the MongoDB user for this application.
 - `CRITIQL_DB_PASSWORD`: The password for the MongoDB user.
 - `CRITIQL_SHEETS_RATE_LIMIT`: The minimum amount of time, in seconds, between requests to the Google Sheets API.

 You can set these environment variables using your operating system, or you can configure them in a `.env` file placed at the root of the `critiql` directory.

 A `template.env` file is included with the project. You can rename this file to `.env`, and configure the variables contained within the file to set up your environment.

 ## Run
 CritiQL requires access to a running MongoDB database. Be sure that the target database is running before you start CritiQL.

 To run the application, navigate to the `critiql` folder and start the application using the command `npm start`. 

# License
This project is licensed under the [MIT License](https://github.com/avielmenter/CritiQL/blob/master/LICENSE).