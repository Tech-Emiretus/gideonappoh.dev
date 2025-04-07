---
id: 3
title: Understanding Database Transaction Isolation Levels
description: Explore the intricacies of database transaction isolation levels and learn how they ensure data consistency and integrity in concurrent environments.
date: 2025-04-06
---

[[toc]]

Before we jump in, have you ever encountered the error below during concurrent writes (especially inserts) in your database?
```sql
> `SQLSTATE[40001]: Serialization failure: 1213 Deadlock found when trying to get lock; try restarting transaction ....`
```
These locks are often caused by the database's transaction isolation level. Let’s dive deeper to understand this better.

## What are database transactions?
Database transactions are a sequence of operations performed as a single logical unit of work. These operations must satisfy the ACID properties:

1. **Atomicity**: Ensures that all operations within a transaction are completed successfully. If any operation fails, the entire transaction is rolled back.
2. **Consistency**: Guarantees that a transaction transforms the database from one valid state to another, maintaining data integrity.
3. **Isolation**: Ensures that concurrent transactions do not interfere with each other, preserving data accuracy.
4. **Durability**: Ensures that once a transaction is committed, its changes are permanent, even in the event of a system failure.

Transactions are essential for maintaining data integrity and consistency, especially in multi-user and concurrent environments. We will not dive deep into the ACID properties and transaction as a topic. Please read more here:

- [Understanding and using transactions in MySQL - Prisma](https://www.prisma.io/dataguide/mysql/inserting-and-modifying-data/using-transactions)
- [ACID Transactions in databases - Databricks](https://www.databricks.com/glossary/acid-transactions)

> [!IMPORTANT]
> By default, MySQL and Postgres both run any query that doesn't have an explicity transaction within a transaction that commits automatically.

## What are transaction isolation levels?
Isolation levels define the degree to which the operations in one transaction are isolated from those in other transactions. From [Prisma](https://www.prisma.io/dataguide/intro/database-glossary#isolation-levels):
> Isolation levels describe different types of trade-offs between isolation and performance that databases can make when processing transactions. Isolation levels determine what types of data leaking can occur between transactions or what data anomalies can occur. In general, greater levels of isolation provide more guarantees at the expense of slower processing.

## Importance of transaction isolation levels?
To understand the importance of isolation levels, we must first explore the issues they aim to address. As stated, isolation levels balance between the how much data can leak outside a transaction and also what anomalies can happen inside a transaction. There are three main issues that isolation levels address.

### Dirty Read
A dirty read occurs when a transaction reads data that has been modified by another transaction but not yet committed. If the modifying transaction rolls back, the data read by the first transaction becomes invalid or inconsistent.

For example: in our products entity
| id  | name       | quantity |
|------|------------|----------|
| 1    | Product A  | 50       |

1. Transaction A updates a record but does not commit the changes.
```sql
START TRANSACTION;
UPDATE `products` SET `quantity` = 100 WHERE `id` = 1;
```
2. Transaction B reads the updated record.
```sql
START TRANSACTION;
SELECT * FROM `products` WHERE `id` = 1; -- quantity = 100
```
3. Transaction A rolls back its changes.
```sql
START TRANSACTION;
UPDATE `products` SET `quantity` = 100 WHERE `id` = 1;
ROLLBACK;
```

In this scenario, Transaction B has read data that is no longer valid, leading to potential inconsistencies.

### Non-repeatable Read
A non-repeatable read occurs when a transaction reads the same row twice and gets different data each time because another transaction has modified and committed the data in the meantime.

For example: in our products entity:
| id  | name       | quantity |
|------|------------|----------|
| 1    | Product A  | 50       |

1. Transaction A reads a record.
```sql
START TRANSACTION;
SELECT * FROM `products` WHERE `id` = 1; -- quantity = 50
```
2. Transaction B updates and commits the record.
```sql
START TRANSACTION;
UPDATE `products` SET `quantity` = 75 WHERE `id` = 1;
COMMIT;
```
3. Transaction A reads the same record again.
```sql
SELECT * FROM `products` WHERE `id` = 1; -- quantity = 75
```

In this scenario, Transaction A observes different data for the same row within its transaction, leading to inconsistencies.

### Phantom Read
A phantom read occurs when a transaction reads a set of rows that satisfy a condition, but another transaction inserts or deletes rows that would have satisfied the same condition, causing the first transaction to see a different set of rows if it repeats the query.

For example: in our products entity:
| id  | name       | quantity |
|------|------------|----------|
| 1    | Product A  | 50       |
| 2    | Product B  | 30       |

1. Transaction A reads all rows where `quantity > 20`.
```sql
START TRANSACTION;
SELECT * FROM `products` WHERE `quantity` > 20;
-- Returns: Product A, Product B
```
2. Transaction B inserts a new record and commits it.
```sql
START TRANSACTION;
INSERT INTO `products` (`id`, `name`, `quantity`) VALUES (3, 'Product C', 25);
COMMIT;
```
3. Transaction A repeats the query.
```sql
SELECT * FROM `products` WHERE `quantity` > 20;
-- Returns: Product A, Product B, Product C
```

In this scenario, Transaction A observes a different set of rows for the same query within its transaction (*product C was not there when transaction started*), leading to inconsistencies.

## Types of transaction isolation levels
The issues stated above are handle to a degree by the four main transaction isolation levels, depending on your use case and the expected behaviour.

### Read Uncommitted.
At the **Read Uncommitted** isolation level, transactions can read data that has been modified by other transactions but not yet committed. This level provides the least isolation and allows for all three anomalies: dirty reads, non-repeatable reads, and phantom reads.

#### Characteristics:
| Anomaly               | Allowed? |
|-----------------------|----------|
| **Dirty Reads**     | ✅ Yes   |
| **Non-Repeatable Reads** | ✅ Yes   |
| **Phantom Reads**   | ✅ Yes   |

#### Use Cases:
- Suitable for scenarios where performance is prioritized over data consistency.
- Common in applications where occasional inconsistencies are acceptable, such as logging or analytics.

> [!WARNING]
> Use this isolation level with caution, as it can lead to significant data integrity issues in critical systems.

### Read Committed
At the **Read Committed** isolation level, a transaction can only read data that has been committed by other transactions. This level prevents dirty reads but allows non-repeatable reads and phantom reads.

#### Characteristics:
| Anomaly               | Allowed? |
|-----------------------|----------|
| **Dirty Reads**     | ❌ No    |
| **Non-Repeatable Reads** | ✅ Yes   |
| **Phantom Reads**   | ✅ Yes   |

#### Use Cases:
- Suitable for most applications where data consistency is important but strict isolation is not required.
- Common in systems where preventing dirty reads is sufficient, such as e-commerce platforms or logging systems.

> [!NOTE]
> This is the default isolation level in many relational database systems, including PostgreSQL and SQL Server.

### Repeatable Read
At the **Repeatable Read** isolation level, a transaction ensures that if it reads the same row twice, it will see the same data both times, even if other transactions modify or delete the data in the meantime. This level prevents dirty reads and non-repeatable reads but allows phantom reads.

#### Characteristics:
| Anomaly               | Allowed? |
|-----------------------|----------|
| **Dirty Reads**     | ❌ No    |
| **Non-Repeatable Reads** | ❌ No    |
| **Phantom Reads**   | ✅ Yes   |

#### Use Cases:
- Suitable for scenarios where consistency of repeated reads within a transaction is critical.
- Common in financial systems or inventory management where accurate and consistent data is essential.

> [!NOTE]
> This is the default isolation level in MySQL. While this level prevents non-repeatable reads, it does not address phantom reads, which may still occur when querying ranges of data.

### Serializable
At the **Serializable** isolation level, transactions are executed in a manner that ensures complete isolation from one another. This level prevents dirty reads, non-repeatable reads, and phantom reads, providing the highest level of isolation but at the cost of performance.

#### Characteristics:
| Anomaly               | Allowed? |
|-----------------------|----------|
| **Dirty Reads**     | ❌ No    |
| **Non-Repeatable Reads** | ❌ No    |
| **Phantom Reads**   | ❌ No    |

#### Use Cases:
- Suitable for scenarios where absolute data consistency is critical, such as financial systems, banking, or inventory systems with strict accuracy requirements.
- Common in applications where the cost of potential anomalies outweighs the performance trade-offs.

> [!WARNING]
> This isolation level can lead to significant performance overhead due to increased locking and reduced concurrency. Use it only when necessary.

> [!TIP]
> Serializable isolation is often implemented using locking or multiversion concurrency control (MVCC), depending on the database system.

### Default
In some database systems, there is a **Default** isolation level which just refers to one of the above. The default transaction isolation level varies depending on the database system being used. Below are some common defaults:

| Database System | Default Isolation Level |
|-----------------|--------------------------|
| **MySQL**       | Repeatable Read         |
| **PostgreSQL**  | Read Committed          |
| **SQL Server**  | Read Committed          |
| **Oracle**      | Read Committed          |

> [!NOTE]
> While these are the defaults, it is always a good practice to explicitly set the isolation level in your application or queries to ensure consistent behavior across environments.

### Summary
Here is a summary of the various isolation levels and the anomalies they allow.

| Isolation Level   | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------------------|------------|---------------------|--------------|
| Read Uncommitted  | ✅ Yes     | ✅ Yes              | ✅ Yes       |
| Read Committed    | ❌ No      | ✅ Yes              | ✅ Yes       |
| Repeatable Read   | ❌ No      | ❌ No               | ✅ Yes       |
| Serializable      | ❌ No      | ❌ No               | ❌ No        |

## Using transaction isolation levels

To check or set the default isolation level in your database:

- **MySQL**:
    ```sql
    -- Check the current isolation level
    SELECT @@transaction_isolation;

    -- Set the isolation level
    SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    ```

- **PostgreSQL**:
    ```sql
    -- Check the current isolation level
    SHOW default_transaction_isolation;

    -- Set the isolation level
    SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL READ COMMITTED;
    ```

- **SQL Server**:
    ```sql
    -- Check the current isolation level
    DBCC USEROPTIONS;

    -- Set the isolation level
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    ```

- **Oracle**:
    ```sql
    -- Check the current isolation level
    SELECT * FROM v$transaction;

    -- Set the isolation level
    ALTER SESSION SET ISOLATION_LEVEL = READ COMMITTED;
    ```

## How can transaction isolation levels cause deadlocks?
When multiple transactions are executed concurrently, the locks and isolation levels can interact in ways that lead to deadlocks. A deadlock occurs when two or more transactions are waiting for each other to release locks, creating a cycle of dependency that prevents any of them from proceeding.

In this post, we didn't really focus on the types of locks, but for a crash course I really enjoyed this post on Mysql Locks by Simon Nino: [Don’t break production: learn about MySQL locks](https://simon-ninon.medium.com/dont-break-production-learn-about-mysql-locks-297671ec8e73)

### Instance of deadlock
This is a simplified example of a deadlock I had to fix recently on MySQL using the default isolation level **Repeatable Read**.

Consider the following scenario with two transactions and a `products` table with auto-increment ID:

| id  | name       | quantity |
|------|------------|----------|
| 1    | Product A  | 50       |
| 2    | Product B  | 30       |

1. **Transaction A** starts a bulk insert statement but doesn't commit:
    ```sql
    START TRANSACTION;
    INSERT INTO `products` (`name`, `quantity`)
    VALUES
        ('Product C', 100),
        ('Product D', 20),
        ('Product E', 45);
    -- Acquires an exclusive lock on the rows being inserted
    ```

2. **Transaction B** also starts a transaction with a bulk insert:
    ```sql
    START TRANSACTION;
    INSERT INTO `products` (`name`, `quantity`)
    VALUES
        ('Product F', 1),
        ('Product G', 23);
    -- Attempts to acquire an exclusive lock, but waits for Transaction A to release its lock
    ```

3. **Transaction B** tries to commit:
    ```sql
   COMMIT;
    -- Waiting for Transaction A to release the lock
    ```

4. **Transaction A** tries to commit:
    ```sql
   COMMIT;
    -- Waiting for Transaction B to release the lock
    ```

At this stage, both transactions are stuck waiting for each other to release their locks, creating a deadlock. The database detects this situation and resolves it by aborting one of the transactions.

#### Solution
We resolved this deadlock by using the `READ COMMITTED` isolation level. It fit our use case and didn't cause any unwanted side effects.

### How Isolation Levels Contribute
- **Higher Isolation Levels**: Levels like `Serializable` or `Repeatable Read` often involve stricter locking mechanisms, increasing the likelihood of deadlocks.
- **Lower Isolation Levels**: Levels like `Read Uncommitted` or `Read Committed` reduce locking but may allow anomalies, which might not be acceptable in all use cases.

### Preventing Deadlocks
To minimize the risk of deadlocks:
1. **Access Resources in a Consistent Order**: Ensure all transactions access tables and rows in the same sequence.
2. **Keep Transactions Short**: Minimize the duration of locks by keeping transactions short and efficient.
3. **Use Appropriate Isolation Levels**: Choose the lowest isolation level that meets your application's consistency requirements.
4. **Enable Deadlock Detection**: Most databases automatically detect and resolve deadlocks by aborting one of the transactions.

By understanding how isolation levels and locking interact, you can design your database operations to minimize deadlocks while maintaining data consistency.

## Conclusion
Understanding the default isolation level of your database system is crucial for designing applications that handle concurrent transactions effectively. Always tailor the isolation level to your application's specific requirements, performance implications, and the concurrency requirements of the project.

Keep in mind that while higher isolation levels offer stronger data consistency guarantees, they may also increase contention and reduce performance in high-concurrency environments. It is essential to test and monitor your application's behavior under different isolation levels to strike the right balance between consistency and performance.

By understanding and leveraging transaction isolation levels appropriately, you can ensure that your application maintains data integrity while meeting its performance goals.
