---
id: 1
title: How to Choose the Right ID Type for Database Entities
description: Choosing the right type of ID when designing database entities is really important. Deciding between integer-based or string based keys - UUIDs, ULID, Snowflake, NanoID etc... matters.
date: 2025-03-25
---

[[toc]]

When designing entities in databases, one of the most critical decisions to make is what ID type to use. It might not be a big problem in small applications, but it's a decision that when not taken diligently, can come back to bite you quite hard in the future.

For instance, on X there was [this realization that UUIDs are not sortable](https://x.com/pontusab/status/1904205433721749949) (not v7 though), and as expected, it was a bit late now - any solution will require some level of extensive work or compromises.

> [!IMPORTANT]
> If you are very certain about the size of your service or application in the range of a few 100,000 or less rows, overthinking this might be overkill. I would suggest just go with integer keys or any that you feel comfortable, the performance costs or gains will be very marginal in your case.

## Why is the type of an ID that important?
Primarily, almost all ORMs, migration libraries, among others tend to use integer-based IDs for database entities which is fine in most small to medium applications, however, they become very important the moment you start doing high throughput and big data systems.

### Non-Sortable IDs can cause huge performance issues
Non sortable IDs such as UUID (not v7) can cause very huge performance issues especially during write-intensive operations.

For instance, shopify increased their database write performance by about 50% by changing their IDs from UUID to Universally Unique Lexicographically Sortable Identifier (ULID). Read more on the [Shopify Engineering Blog](https://shopify.engineering/building-resilient-payment-systems)

> [!NOTE]
> From Shopify's Blog: "In one high-throughput system at Shopify we’ve seen a 50 percent decrease in INSERT statement duration by switching from UUIDv4 to ULID for idempotency keys."

### Deterministic IDs like Integers can cause some security Risks.
For instance, exposing deterministic IDs, especially integer-based IDs, can be deemed as:

- **Data Security Risk** First danger is what OWASP terms as [Insecure Direct Object References](https://wiki.owasp.org/index.php/Top_10_2013-A4-Insecure_Direct_Object_References) -  If someone discovers the ID of an entity, and your application lacks sufficient authorization controls to prevent it, they can do things that you didn't intend.

- **Business Intelligence Security Risk**  when integer based IDs are exposed in a URL. Integer IDs can be used to determine:

    - **Overall Business Size** - to know the number of entities within the system, usually important entities such as total number of orders in the system, number of users in the system, number of transactions, etc...

    - **Overall Business Velocity** - competitors can use ID changes to determine how quickly your business is growing. For instance, if the max order ID was 6000 and after a week it hovers 6010, then you got 10 orders for that week which they can use for competitive research and insight.

## Characteristics of Good ID Type In Distributed Systems
1. **Idempotent & Universally Unique**: In the world of distributed systems, having a timestamp-based ID such as ULID or even a more extensive ID like snowflakes where, in addition, the machine ID is considered as part of the ID is very important in prevent ID collisions and actually give a true sense of

2. **Sortable**: Writing and rebuilding indexes (e.g. B-tree indexes in MySQL) are way performant with sortable indexes as compared to non-sortable ones.

3. **Reasonable Data Size** - IDs are usually the first things we index in our databases, sometimes even used in composite indexes. The size of the ID field type matters, integers will be smaller as compared to strings and composite indexes in some database systems like MySQL has a max index key size:

    > [!WARNING]
    > Prefix support and lengths of prefixes (where supported) are storage engine dependent. For example, a prefix can be up to 767 bytes long for InnoDB tables that use the REDUNDANT or COMPACT row format. The prefix length limit is 3072 bytes for InnoDB tables that use the DYNAMIC or COMPRESSED row format. [Read More](https://dev.mysql.com/doc/refman/8.4/en/create-index.html).

4. **Non-Deterministic** - To prevent the issues such as [Insecure Direct Object Reference and exposing business intelligence](#deterministic-ids-like-integers-can-cause-some-security-risks).

### Why Sortable IDs?

In the [tweet](https://x.com/pontusab/status/1904205433721749949) above, I saw a comment of someone asking why do we even need sortable IDs. A few points:

- **Performance**: Sortable IDs improve database write efficiency by optimizing index updates.

- **Chunking Large Datasets with a unique key**: They enable efficient processing of large datasets by dividing them into manageable chunks.

    ```sql
    SELECT `id`, `field1`, `field2`
    FROM `table`
    WHERE `id` >= '<offset-id>'
    ORDER BY `id` ASC
    LIMIT 10000
    ```

- **ID-based offset pagination**: Sortable IDs allow for consistent and performant pagination in large datasets when using the id as the offset field.

- **Better UX in exported contents like csv**: They ensure exported data (e.g., CSV files) is ordered logically, improving readability and usability.

## Examples of Good ID Types In Distributed Systems

> [!CAUTION]
> This is by no means an exhaustive list. Sorry if you beloved ID type is not in the list.

### ULID (Universally Unique Lexicographically Sortable Identifier)

- 128 bit identifiers encoded as a 26 character strings.

- Very high collision tolerance, there are 280 possible IDS within a millisecond

- Example `01ARZ3NDEKTSV4RRFFQ69G5FAV`

- [Read More](https://github.com/ulid/spec)

### SnowFlake IDs

- Used by platforms like Twitter, these are time-based, unique IDs that include timestamp, machine ID, sequence number.

- SnowFake IDs are very popular in large distributed systems.

- Example `1541815603606036480`

- [Read More](https://en.wikipedia.org/wiki/Snowflake_ID)

### NanoID with Timestamp

- A customizable ID generator where you can prepend a timestamp for sorting.

- Check out this popular [NodeJS package](https://github.com/ai/nanoid)

### UUIDv7

- A time-sortable version of UUID that offers a precise timestamp up to 50 nanosecond resolutions.

- Unlike UUIDv4, most SQL based databases such as MySQL and Postgres don't support this natively yet so you'll have to generate this on the application layer.

- Example `0195d095-a57d-716f-9397-8c8d63054109`

- [Read More](https://uuid7.com/)

### Unsigned Big Integers
- In big systems, if we need integer IDs, I always go for unsigned big integers.

- Most systems do outgrow their normal 32 bit integer IDs and have to do either a very expensive operation or a large table migration that can be a pain depending on how critical the system is.

- If there is any chance the rows in the entity can grow quite a lot, stick with big integers by default.

## Redemption for Integer-Based IDs

In my several years of building large data systems, I've settled on the approach where I usually combine both an integer-based ID (for internal purposes) and a string based idempotent ID such as ULID or UUIDv7 (for external purposes).

### Why not both?

Unsigned big integers are very useful as internal IDs because;

- **Readability** for starters, they are just comprehensible numbers, easier to read and understand.

- **Performance** string comparison will always be slower as compared to integer comparisons. I remember in a large system we had to sometimes cast strings to `BINARY` in mysql to achieve reasonable performance.

- **Data Size** string keys in larger database indexes will use more memory and disk space as compared to integers.

On the other hand, we use the string-based IDs such as UUIDv7 or ULID as external ID because:

- **Curbs data or business risks** As stated in [the section above](#deterministic-ids-like-integers-can-cause-some-security-risks), we don't have to worry about the short falls of exposed IDS especially in public APIs.

- **Easier for Log Record Identification** easy to search through millions of logs with a globally unique key.

- **

### Implementation

- Any entity that will be exposed externally from the service will have both `id` and `public_id` fields.

- ID is auto incremental primary key and the `public_id` can be generated through creation hooks or even by the database if it supports it. For instance in Laravel, all we have to do is add a creating hook:

    ```php
    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Support\Str;

    class Entity extends Model
    {
        protected static function booted(): void
        {
            parent::booted();

            static::creating(function (Model $model) {
                $model->public_id ??= Str::ulid();
            });
        }
    }
    ```

- The `public_id` is not used for anything internally, only when sending an output (e.g. JSON response) or when parsing an input through the URL or request payload.

- The `id` which is integer-based is then used for all internal queries, joins, foreign keys (if needed), etc... to get that extra ounce of performance.

## Conclusion
Choosing the right ID type for your database entities is a critical decision that can significantly impact the performance, scalability, and security of your application. While integer-based IDs are simple, efficient, and ideal for internal operations, string-based IDs like snowflake ID, ULID or UUIDv7 offer global uniqueness and mitigate security risks when exposed externally.

By combining both approaches—using integers for internal queries and string-based IDs for external interactions—you can achieve the best of both worlds: performance and security. Ultimately, the choice of ID type should align with your application's specific requirements, balancing simplicity, scalability, and future-proofing.
