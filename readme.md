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
    sunset:date,
    inverters:str[]
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
        200:{
            "msg": "Successfully logged in."
            "jwt":{
               "access_token": "str",
               "token_type": "bearer",
               "expires_in": "int", 
            }
        },
        401:{
            "msg": "Mismatched credentials."
        },
        500:{
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
        200: {
            "msg": "Successfully registered for fronius."
        },
        400:{
            "msg": "Unauthorized for performing registration."
        },
        401:{
            "msg": "Your fronius credentials are invalid."
        },
        500:{
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
        200: {
            "msg": "Successfully registered for enphase."
        },
        400:{
            "msg": "Unauthorized for performing registration."
        },
        401:{
            "msg": "Your enphase credentials are invalid."
        },
        500:{
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
        200:{
            "msg": "All registered brands working properly.", 
            "brands":"str[]"
        },
        200:{
            "msg": "No brands registered. or All registered brands are down."
        },
        206:{
            "msg": "A portion of registered brands working properly.",
            "brands":"str[]"
        },
        500:{
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
        200:{
            "systems": "System[]",
            "pages":"int"
        },
        200:{
            "msg": "Page index out of bounds.",
            "pages":"int"
        },
        500:{
            "msg": "Internal server error."
        }
    }
    ```

6. /systems/{brand}/{id}
    + desc: Get a single system of a specfic brand.
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

