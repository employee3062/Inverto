# Inverto - deal with inverters in a data friendly way. ✨

This project was intended to serve any project with inverters data from any brand by 
implementing a common data interface so that just swapping the brand names we can hit the exact same api routes and it should work with same data formatting.

## Current Available Brands
+ fronius
+ enphase

## Schemas:
1. System =  
```json
{
    "id":"str",
    "name":"str",
    "power":"decimal", // live
    "sunrise":"HH:MM AM/PM",
    "sunset":"HH:MM AM/PM",
    "inverters":"str[]",
    "timezone": "str",
    "brand": "str",
    "address": {
        "city": "str",
        "state": "str",
        "country": "str",
        "postal_code": "str"
    },
}
```

2. Inverter = 
```json
{
    "id": "str",
    "sys_id":"str",
    "power": "decimal", // live
    "status": "red/green/moon",
    "reason": "str or None",
    // use events for finding out the exact reason behind status being red. 
    "events": "str[] containg array of events id"
}
```

3. Stats = 
```json
{
    "energy": "decimal",
    "co2_saving": "decimal",
    "since": "date (starting date for period)",
    "duration":"day,week,month,year",
    "last_reported": "date,time" // when this stats was gathered atlast.
}
```

4. ErrEvent = 
```json
{
    "id": "str",
    "msg": "str",
    "code": "int",
    "when": "date,time",
    "assigned": "str -> inverter-id/system-id"
    // it's moose who will assign color to this events as per msg and code.
}
```

## Current Available Routes

### version 1.0.0

0. verification criteria
    + desc: Except `/auth` routes every routes needs inverto account verification via jwt token by passing it as bearer in `Authorization` header of every request.
    + headers: 
    ```json
    {
        "Authorization": "'Bearer ' + token",
        "Content-Type": "application/json"
    }
    ```
    + response:
    ```json 
    {
        "401": {
            "msg": "Unauthorized to access this route."
        }
    }
    ```

1. /auth/signin
    + desc: SignIn into the inverto api with company's login credenetials.
    + method: POST
    + body:
    ```json
    {
        "username": "str",
        "password": "str"
    }
    ```
    + response: 
    ```json
    {
        "200":{
            "msg": "Successfully logged in.",
            "jwt":{
               "access_token": "str",
               "token_type": "bearer",
               "expires_in": "int", 
            }
        },
        "401":{
            "msg": "Mismatched credentials."
        },
        "500":{
            "msg": "Internal server error."
        }
    }
    ```

2. /register/fronius 
    + desc: Registers an inverto account holder for getting information from fronius brand by saving their credentials on their behalf.
    + method: POST
    + body:
    ```json
    {
        "ak_id":"str",
        "ak_value":"str",
        "usr_id":"str",
        "pass":"str"
    }
    ```
    + responses: 
    ```json
    {
        "200": {
            "msg": "Successfully registered for fronius."
        },
        "400":{
            "msg": "Unauthorized for performing registration."
        },
        "401":{
            "msg": "Your fronius credentials are invalid."
        },
        "500":{
            "msg": "Internal server error."
        }
    }
    ```

3. /register/enphase
    + desc: Registers an inverto account holder for getting information from enphase brand by saving their credentials on their behalf.
    + method: POST
    + body:
    ```json
    {
        "ak_id":"str",
        "ak_value":"str",
        "usr_id":"str",
        "pass":"str",
        "api_key":"str"
    }
    ```
    + responses: 
    ```json
    {
        "200": {
            "msg": "Successfully registered for enphase."
        },
        "400":{
            "msg": "Unauthorized for performing registration."
        },
        "401":{
            "msg": "Your enphase credentials are invalid."
        },
        "500":{
            "msg": "Internal server error."
        }
    }
    ```

4. /health
    + desc: Checks if all registered brands are healthy for the company account.
    + method: GET
    + response: 
    ```json
    {
        "200":{
            "msg": "All registered brands working properly.", // or
            "msg": "No brands registered. or All registered brands are down.",
            "brands":"str[]"
        },
        "206":{
            "msg": "A portion of registered brands working properly.",
            "brands":"str[]"
        },
        "500":{
            "msg":"Internal server error."
        }
    }
    ```

5. /systems
    + desc: Returns all `systems` accross all registered brands with a max limit of `50`, you can use the `brands` query parameter to priotize and filter brands inspite of getting all brands.
    + method: GET
    + params: 
    ```json
    {
        "pageNo": "int",
        "brands":"str[]" // empty includes all brand.
    }
    ```
    + response: 
    ```json
    {
        "200":{
            "systems": "System[]",
            "pages":"int"
        },
        "404":{
            "msg": "Page index out of bounds.",
            "pages":"int"
        },
        "500":{
            "msg": "Internal server error."
        }
    }
    ```

6. /systems/{brand}/{sys_id}
    + desc: Get a single system of a specfic brand.
    + method: GET
    + response: 
    ```json
    {
        "200":"System",
        "400":{
            "msg": "Invalid brand name."
        },
        "404":{
            "msg": "System not found."
        },
        "500":{
            "msg": "Internal server error."
        }
    }
    ```
7. /systems/status/{brand}/{sys_id}
    + desc: Get the system status accumulating based on it's inverter status and give and overall summary of which inverters are in which state and the overall state of the system.
    + method: GET
    + response:
    ```json
    {
        "200":{
            "msg": {
                "red":"str[]" , // inverter ids
                "green": "str[]",
                "moon": "str[]",
                "status":"red/green/moon"
            }
        },
        "400": {
            "msg":"Not a valid brand."
        },
        "404":{
            "msg":"System not found."
        },
        "500":{
            "msg":"Internal server error."
        }
    }

8. /systems/stats/{brand}/{sys_id}
    + desc: Get the stats of energy and co2 aggregated by a specfic time range
    by a specfic system.
    + method: GET
    + params:
    ```json 
    {
        "since": "date",
        "duration": "day/week/month/year"
    }
    ``` 
    + response:
    ```json
    {
        "200": "Stats",
        "400":{
            "msg": "Not a valid brand.",
        },
        "404": {
            "msg":"Stats not available since then.", // or
            "msg":"System not found",
        },
        "500":{
            "msg": "Internal server error"
        }
    }
    ```

9. /systems/err_events/{brand}/{sys_id}:
    + desc: Find all the error events that occured in the system since a specific time range.
    + method: GET
    + params:
    ```json
    {
        "since":"date",
        "duration": "day,week,month,year",
    }
    ```
    + response: 
    ```json 
    {
        "200": "ErrEvent[]",
        "400": {
            "msg":"Not a valid brand."
        },
        "404":{
            "msg":"Error events not available since then",
            "msg":"System not found."
        },
        "500":{
            "msg":"Internal server error."
        }
    }

10. /inverters/{brand}/{sys_id}
    + desc: Get all inverters under a system.
    + method: GET
    + response: 
    ```json 
    {
        "200": "Inverter[]",
        "400": {
            "msg":"Not a valid brand."
        },
        "404":{
            "msg":"System not found."
        },
        "500":{
            "msg":"Internal server error."
        }
    }

11. /inverters/stats/{brand}/{sys_id}/{inv_id}
    + desc: Get the stats of energy and co2 aggregated by a specfic time range
    by an inverter of a specfic system.
    + method: GET
    + params:
    ```json 
    {
        "since": "date",
        "duration": "day/week/month/year"
    }
    ``` 
    + response:
    ```json
    {
        "200": "Stats",
        "400":{
            "msg": "Not a valid brand.",
        },
        "404": {
            "msg":"Stats not available since then.", // or
            "msg":"System not found", // or
            "msg":"Inverter not found"
        },
        "500":{
            "msg": "Internal server error"
        }
    }
    ```

12. /inverters/err_events/{brand}/{sys_id}/{inv_id}:
    + desc: Find all the error events that occured in the inverter of a system since a specific time.
    + method: GET
    + params:
    ```json
    {
        "since":"date",
        "duration": "day,week,month,year",
    }
    ```
    + response: 
    ```json 
    {
        "200": "ErrEvent[]",
        "400": {
            "msg":"Not a valid brand."
        },
        "404":{
            "msg":"System not found.", // or
            "msg": "Inverter not found.", // or 
            "msg": "Error events not available since then."
        },
        "500":{
            "msg":"Internal server error."
        }
    } 

