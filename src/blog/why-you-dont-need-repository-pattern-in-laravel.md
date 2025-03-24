---
id: 1
title: Why You Don't Need the Repository Pattern in Laravel
description: Learn why you don't necessarily need the repository pattern in Laravel. In some cases, it might even be overkill. We'll also explore when you might actually need it and how to use it properly.
date: 2025-03-23
---

[[toc]]

I was cruising X and noticed [some discussions](https://x.com/OMascatinho/status/1903551676176371954) on why not to use Eloquent models directly but instead utilize the repository pattern. From my years of experience, I tend to disagree, and I will explain why in detail shortly. To ensure I'm not stuck in my own opinionated bubble, I researched this topic and found some interesting articles, one of them being [I Don’t Need the Repository Pattern in Laravel. (Change My Mind)](https://medium.com/@barfiagyenim/i-dont-need-the-repository-pattern-in-laravel-change-my-mind-11828ce72d8e) by [Barfi Boateng](https://x.com/barfiagyenim).

## What is the Repository Pattern?

Let's start by understanding what the repository pattern is. Google defines it as:

*"The Repository Pattern is a software design pattern that acts as an intermediary between your application's business logic and data storage, abstracting away the complexities of data access and providing a consistent interface for interacting with data."*

### Benefits of the Repository Pattern

- **Improved Testability**: We can easily mock repositories during unit testing.
- **Decoupling Business Logic from Data Access**: Sometimes, we might need to perform logic before running database queries. This helps decouple that logic from the controller.
- **Abstraction**: We can implement different versions of the same repository and use them interchangeably.

This essentially means we have a central place to manage all our data-related logic. From my experience, this pattern is very common in ecosystems like Golang and Node.js, where ORMs are not as prevalent. In the PHP world, this makes sense when using raw PHP. However, in Laravel, I believe Eloquent is more than sufficient for the majority of applications.

## Why You Don't Need the Repository Pattern in Laravel

To fully understand my position, let's examine some common arguments for the repository pattern and why you might not need it:

- **What happens if you want to change your database?**: This is the most common argument for the repository pattern. My counterpoints are:

    - In real-world production environments, how often have you seen applications with active users change their database? In my experience, it's almost never. The primary database is usually retained, with additional databases employed for specific purposes like performance or reporting. This makes the repository pattern a case of premature optimization and, in some cases, over-engineering.

    - Laravel provides a highly configurable database connection setup by default. In rare cases where something isn't supported, there is almost always a community package that allows Eloquent to integrate with other databases. All you need to do is define the connection and dynamically choose the appropriate database in your application code.

- **Not cluttering controllers and keeping business logic separate**: While I agree with this principle, you don't necessarily need a repository to achieve it.

    - Business logic often includes logging, events, notifications, instrumentation, etc., which are not limited to database queries. In such cases, a `Service` class or an `Action` is more appropriate.

    - Many repositories I've encountered simply reinvent the wheel by duplicating Eloquent's functionality:
    ```php
    class UserRepository
    {
        public function find(int $id): ?User
        {
            return User::find($id);
        }
    }
    ```

- **De-duplicating the codebase by avoiding repeated queries**: While this is a good practice for maintainability, it doesn't necessitate the repository pattern.

    - Often, we share business logic between entry points (e.g., controllers and console commands) rather than the underlying queries. In such cases, a `Service` class or an `Action` is sufficient.

    - You can use [Eloquent Query Scopes](https://laravel.com/docs/12.x/eloquent#query-scopes) or helper methods on models to encapsulate repeated queries.

    - For complex queries or large customizations, you can even use custom [Query Builders](https://martinjoo.dev/build-your-own-laravel-query-builders) in Laravel.

- **Improving testability by mocking repositories**: While this is valid in environments like Golang and Node.js, Laravel offers a robust suite of testing tools. These include database factories, mocking objects directly in the application container, and traits like `DatabaseTransactions` and `RefreshDatabase`, which provide a wide range of options for writing unit tests that touch the database.

> [!CAUTION]
> A common issue with the repository pattern is that it often ends up re-implementing methods that already exist in Eloquent. Worse, some developers inject concrete repositories directly into controllers or commands, defeating the primary advantage of the repository pattern: abstraction and the ability to swap data operations depending on the database.

## How to Properly Implement the Repository Pattern When Needed

### Best Practices to Follow:
- Always pass the interface of the repository as a dependency to consuming classes such as controllers, commands, etc.
- Bind the appropriate concrete repository to the application container during service provider registration. This allows the interface to be resolved during dependency injection.
- Determine the correct concrete repository to use based on a `config` value, context data, or a flag.

> [!IMPORTANT]
> **Always build to an interface of the repository.** The main purpose of the repository pattern is abstraction and the ability to work with different databases. Injecting concrete implementations into controllers or commands defeats this purpose entirely.

### Example

One of the few scenarios where I found the repository pattern useful was in a reporting system. The raw data was stored in a MySQL database, but for performance and time-based queries, we used Elasticsearch. This was in a GraphQL service, but the principles apply universally.

**Context**:
- We need to call the same methods or retrieve the same data from both MySQL and Elasticsearch.

- The database to use can be specified via a GraphQL directive (`@realtime`), an HTTP header, or an artisan command option.

- The selected database is stored in the `Context` facade for later use.

- When resolving interfaces, we check the `Context` value to determine the appropriate repository.
<br  />
<br />

**Step 1:** Define the methods required in the interface.

```php
namespace App\Repositories;

interface MetricRepositoryInterface
{
    public function getAggregatedSingleValueMetrics(): array;

    public function getMetricsOverTime(PeriodEnum $period): ?array;
    // ...
}
```

**Step 2:** Implement the `MetricRepositoryInterface` for both MySQL and Elasticsearch.

```php
namespace App\Repositories;

class MysqlMetricRepository implements MetricRepositoryInterface
{
    public function getAggregatedSingleValueMetrics(): array
    {
        // Query MySQL tables
    }

    public function getMetricsOverTime(PeriodEnum $period): ?array
    {
        // Query MySQL tables
    }
}
```

```php
class ElasticsearchMetricRepository implements MetricRepositoryInterface
{
    public function getAggregatedSingleValueMetrics(): array
    {
        // Query Elasticsearch index
    }

    public function getMetricsOverTime(PeriodEnum $period): ?array
    {
        // Query Elasticsearch index
    }
}
```

**Step 3:** Inject the interface into the controller.

```php
namespace App\Http\Controllers;

use App\Enums\PeriodEnum;
use App\Repositories\MetricRepositoryInterface;
use Illuminate\Http\JsonResponse;

class MetricsController
{
    public function __construct(private MetricRepositoryInterface $repository)
    {
        //
    }

    public function getAggregatedSingleValueMetrics(): JsonResponse
    {
        return response()->json($this->repository->getAggregatedSingleValueMetrics(), JsonResponse::HTTP_OK);
    }

    public function getMetricsOverTime(PeriodEnum $period): JsonResponse
    {
        return response()->json($this->repository->getMetricsOverTime($period), JsonResponse::HTTP_OK);
    }
}
```

**Step 4:** Resolve the appropriate repository in the service provider.

```php
namespace App\Providers;

use App\Repositories\ElasticsearchMetricRepository;
use App\Repositories\MetricRepositoryInterface;
use App\Repositories\MysqlMetricRepository;
use Illuminate\Support\Facades\Context;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(MetricRepositoryInterface::class, function () {
            $database = Context::get('data_store');

            return $database === 'elasticsearch' ? new ElasticsearchMetricRepository() : new MysqlMetricRepository();
        });
    }
}
```

## Conclusion

The repository pattern is a powerful tool, but it is not always necessary in Laravel applications. For most use cases, Laravel's Eloquent ORM provides sufficient abstraction and functionality to manage data access effectively. Overusing the repository pattern can lead to unnecessary complexity, premature optimization, and duplication of Eloquent's features.

However, there are specific scenarios, such as working with multiple data sources or implementing complex data access logic, where the repository pattern can be beneficial. When using it, always adhere to best practices, such as building to interfaces and leveraging Laravel's service container for dependency injection.

Ultimately, the decision to use the repository pattern should be guided by the specific needs of your application, avoiding over-engineering while maintaining clean and maintainable code.
