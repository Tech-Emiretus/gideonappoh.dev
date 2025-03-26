---
id: 1
title: How to Choose the Right ID Type for Database Entities
description: Choosing the right type of ID when designing database entities is crucial. Deciding between integer-based or string-based keys—UUIDs, ULID, Snowflake, NanoID, etc.—matters.
date: 2025-03-25
---

[[toc]]

When designing entities in databases, one of the most critical decisions is what ID type to use. While it might not seem like a big problem in small applications, a poorly chosen ID type can lead to significant challenges as your application scales.

For instance, on X, there was [this realization that UUIDs are not sortable](https://x.com/pontusab/status/1904205433721749949) (not v7 though). Unfortunately, by the time this issue was discovered, addressing it will require extensive work or compromises.

> [!IMPORTANT]
> If your application is small, with a few hundred thousand rows or less, overthinking this might be overkill. In such cases, integer keys or any familiar option should suffice, as performance differences will be marginal.

## Why is the Type of an ID Important?

Most ORMs and migration libraries default to integer-based IDs for database entities. While this works well for small to medium applications, the choice of ID type becomes critical in high-throughput and large-scale systems.

### Non-Sortable IDs Can Cause Performance Issues

Non-sortable IDs, such as UUID (not v7), can lead to significant performance issues, especially during write-intensive operations.

For example, Shopify improved their database write performance by about 50% by switching from UUIDv4 to Universally Unique Lexicographically Sortable Identifier (ULID). Read more on the [Shopify Engineering Blog](https://shopify.engineering/building-resilient-payment-systems).

> [!NOTE]
> From Shopify's Blog: "In one high-throughput system at Shopify, we’ve seen a 50 percent decrease in INSERT statement duration by switching from UUIDv4 to ULID for idempotency keys."

### Deterministic IDs Like Integers Can Pose Security Risks

Exposing deterministic IDs, especially integer-based IDs, can lead to:

- **Data Security Risks**: OWASP refers to this as [Insecure Direct Object References](https://wiki.owasp.org/index.php/Top_10_2013-A4-Insecure_Direct_Object_References). If someone discovers an entity's ID and your application lacks proper authorization controls, they could exploit it.

- **Business Intelligence Risks**: Exposing integer-based IDs in URLs can reveal:
  - **Business Size**: Competitors can estimate the total number of entities in your system, such as orders, users, or transactions.
  - **Business Velocity**: By observing changes in IDs over time, competitors can infer your growth rate. For example, if the max order ID increases from 6000 to 6010 in a week, they know you processed only 10 orders that week.

## Characteristics of a Good ID Type in Distributed Systems

1. **Idempotent & Universally Unique**: Timestamp-based IDs like ULID or Snowflake IDs prevent collisions and provide a true sense of uniqueness in distributed systems.

2. **Sortable**: Sortable IDs improve the performance of index updates (e.g. B-tree indexes in MySQL) and enable efficient data processing.

3. **Reasonable Data Size**: Since IDs are often indexed, their size matters. Integer IDs are smaller than string-based IDs, which is important for databases with index size limits. For example, MySQL has a hard limit on index key length:

    > [!WARNING]
    > Prefix support and lengths of prefixes (where supported) depend on the storage engine. For example, InnoDB tables using the DYNAMIC or COMPRESSED row format have a prefix length limit of 3072 bytes. [Read More](https://dev.mysql.com/doc/refman/8.4/en/create-index.html).

4. **Non-Deterministic**: To avoid issues like [Insecure Direct Object References](#deterministic-ids-like-integers-can-cause-some-security-risks) and exposing business intelligence.

### Why Sortable IDs?

In the [tweet](https://x.com/pontusab/status/1904205433721749949) mentioned earlier, someone asked why sortable IDs are necessary. Here are a few reasons:

- **Performance**: Sortable IDs optimize database write efficiency by improving index updates.

- **Chunking Large Datasets**: They enable efficient processing of large datasets by dividing them into manageable and definite sized chunks where fields like creation timestamp can't guarantee.

    ```sql
    SELECT `id`, `field1`, `field2`
    FROM `table`
    WHERE `id` >= '<offset-id>'
    ORDER BY `id` ASC
    LIMIT 10000
    ```

- **ID-based offset pagination**: Sortable IDs allow consistent and performant pagination in large datasets when using the id as the offset field.

- **Better UX in Exported Data**: They ensure exported data (e.g., CSV files) is ordered logically, improving readability and usability.

## Examples of Good ID Types in Distributed Systems

> [!CAUTION]
> This is not an exhaustive list. Apologies if your favorite ID type is missing.

### ULID (Universally Unique Lexicographically Sortable Identifier)

- 128-bit identifiers encoded as 26-character strings.
- High collision tolerance, with 280 possible IDs per millisecond.
- Example: `01ARZ3NDEKTSV4RRFFQ69G5FAV`
- [Read More](https://github.com/ulid/spec)

### Snowflake IDs

- Time-based unique IDs that include a timestamp, machine ID, and sequence number.
- Popular in large distributed systems (e.g., Twitter).
- Example: `1541815603606036480`
- [Read More](https://en.wikipedia.org/wiki/Snowflake_ID)

### NanoID with Timestamp

- A customizable ID generator that can prepend a timestamp for sorting.
- Check out this popular [Node.js package](https://github.com/ai/nanoid).

### UUIDv7

- A time-sortable version of UUID with precise timestamps (up to 50 nanoseconds).
- Not natively supported by most SQL databases yet, so it must be generated at the application layer.
- Example: `0195d095-a57d-716f-9397-8c8d63054109`
- [Read More](https://uuid7.com/)

### Unsigned Big Integers

- Ideal for systems requiring integer IDs. Use unsigned big integers to avoid outgrowing 32-bit integer limits.
- Example: `18446744073709551615` (max value for unsigned 64-bit integers).

## Redemption for Integer-Based IDs

In my experience, building large data systems, I often combine integer-based IDs (for internal use) with string-based IDs (e.g., ULID or UUIDv7) for external use.

### Why Not Both?

- **Internal IDs (Integer-Based)**:
  - **Readability**: Easier to understand and debug.
  - **Performance**: Integer comparisons are faster than string comparisons.
  - **Data Size**: Integer keys use less memory and disk space in indexes.

- **External IDs (String-Based)**:
  - **Security**: Mitigates risks like [Insecure Direct Object References](#deterministic-ids-like-integers-can-cause-some-security-risks).
  - **Log Identification**: Easier to search logs with globally unique keys.
  - **Globally Unique**: Identifiable even within other services.

### Implementation

For entities exposed externally, use both `id` (integer) and `public_id` (string):

- `id` auto-increment primary key and the `public_id` can be generated through creation hooks or even by the database if supported. Example using creating hook in Laravel:

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

- Use `public_id` for external interactions (e.g., JSON responses, URLs) and `id` for internal queries, joins, and foreign keys.

## Conclusion

Choosing the right ID type for your database entities is a critical decision that impacts performance, scalability, and security. By combining integer-based IDs for internal operations with string-based IDs for external interactions, you can achieve the best of both worlds: performance and security. Ultimately, the choice should align with your application's specific requirements, balancing simplicity, scalability, and future-proofing.
