# Inverto - deal with inverters in a data friendly way. ✨

This project was intended to serve any project with inverters data from any brand by 
implementing a common data interface so that just swapping the brand names we can hit the exact same api routes and it should work with same data formatting.

## Current Available Brands
+ fronius
+ enphase

## Schemas:
1. System = {
    id:str,
    name:str,
    power:decimal
    sunrise:date
    sunset:date
}

2. Inverter = {
    id: str
    sys_id:str,
    power: decimal,
    status: red/green/moon,
    reason: str,
    events: str[] containg array of events id.
}

3. Stats = {
    energy: decimal
    co2_saving: decimal
    duration: day,month,week,year
    since: date (starting date for period)
}

4. Event = {
    id: str
    msg: str,
    code: int,
    color: str,
    assigned: str - inverter-id
}

## Current Available Routes

### version 1

1. /auth/signin
    + desc: logs into the inverto api platform the company user account that inverto will provide to customers.
    + method: POST
    + body: {
        usrname:str,
        pass:str
    }
    + response: {
        200:{
            msg: successfully logged in.
            jwt:{
               access_token: str,
               token_type: bearer,
               expires_in: int, 
            }
        }
        401:{
            msg: mismatched credentials. 😵
        }
    }

2. /register/fronius 
    + desc: register an account holder for getting information from fronius brand by saving their credentials on their behalf.
    + method: POST
    + body: {
        ak_id:str,
        ak_value:str,
        usr_id:str,
        pass:str
    }
    + responses: {
        200: {
            msg: successfully registered for fronius. ⚡️
        },
        400:{
            msg: unauthorized for performing registration. 🏴‍☠️ 
        },
        401:{
            msg: your fronius credentials are invalid.
        },
        500:{
            msg: something went wrong.
        }
    }

2. /health
    + desc: check if all registered brands are healthy for the user.
    + method: GET
    + response: {
        200:{
            msg: "All registered brands working properly" 
            brands:str[]
        },
        200:{
            msg: "No brands registered" or
                 "All registered brands are down"
        },
        206:{
            msg: A portion of registered brands working properly.
            brands:str[]
        },
        500:{
            msg:Something went wrong.
        }
    }

3. /systems
    + desc: Returns all systems accross all registered brands with a max limit of 50, you can use the brands query params to priotize and filter brands inspite of getting all brands.
    + method: GET
    + headers: {
        Authorization: 'Bearer ' + token,
        Content-Type: 'application/json'
    }
    + params: {
        page: int
        brands:str[] // empty means all.
    }
    + response: {
        200:{
            systems: System[]
            pages:int
        },
        200:{
            msg: page index out of bounds.
            pages:int
        }
        500:{
            msg: something went wrong.
        }
    }

4. /systems/{brand}/{id}
    + desc: Get a single system from a specfic brand.
    + method: GET
    + response: {
        200:System,
        400:{
            msg: Invalid brand name.
        },
        404:{
            msg: System not found.
        },
        500:{

        }
    }

