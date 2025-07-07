# PlanIt

PlanIt is a streamlined scheduling web application that helps small service-based businesses eliminate the inefficiencies of manual appointment coordination. Many independent professionals such as barbers, photographers, and tutors still rely on phone calls, emails, or paper calendars, resulting in double-bookings, time loss, and dissatisfied clients. PlanIt addresses this issue by providing a centralized, shareable booking calendar that empowers clients to self-schedule appointments.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (with [pgAdmin4](https://www.pgadmin.org/))
- [npm](https://www.npmjs.com/)
- Git

### Installing

A step by step series of examples that tell you how to get a development env running

1. Clone the repository

```
git clone https://github.com/Ownerxpractice/planit
cd planit
```
2. Install dependencies

```
npm install
```
3. Set up PostgreSQL database

    1. Open pgAdmin4
    2. Create a new databse (e.g., planit_db)
    3. Add credentials to app.js by editing the .env file

4. Run the development server

```
npm run dev
```

5. Access the local app

Open your browser and go to http://localhost:3000

## Running the tests

To run the automated tests
```
npm test
```

## Deployment

This system is running on an AWS instance through AWS Educate.

## Built With

* [PostgreSQL](https://www.postgresql.org/) - Database
* [Express.js](https://expressjs.com/) - Backend Framework
* [EJS](https://ejs.co/) – Templating / View Engine 
* [Node.js](https://nodejs.org/) - Server Environment

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* [Noelia Canela](https://github.com/noeliacanela229)
* [Taylor Davis](https://github.com/tjdavis51)
* [Kieran McKinney](https://github.com/affengold)
* [Brandon Tavares](https://github.com/Btavares64)
* [ShaNiece Twitty](https://github.com/STwittyDataLab)
* [John Zeledon](https://github.com/jaz265nau)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
