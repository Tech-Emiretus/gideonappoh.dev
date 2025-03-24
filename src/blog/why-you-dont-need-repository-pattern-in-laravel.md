---
id: 1
title: Why you don't need repository pattern in Laravel
description: Learn why you don't necessarily need repository pattern in Laravel, in some cases it might even be an overkill, then we look into when you might actually need one and how to use it properly
date: 2025-03-23
---

[[toc]]

I was cruising X and noticed [some discussions](https://x.com/OMascatinho/status/1903551676176371954) on why not to use Eloquent models directly but utilize the repository pattern. From my years in experience, I tend not to agree and I will explain in detail very shortly. Just to make sure I am not in my own opinionated bubble, I searched on this topic and found some interesting articles, one of them being [I don’t need the Repository Pattern in laravel. (Change my mind)](https://medium.com/@barfiagyenim/i-dont-need-the-repository-pattern-in-laravel-change-my-mind-11828ce72d8e) By [Barfi Boateng](https://x.com/barfiagyenim).

## What is the repository pattern?

Let's start by knowing what the repository pattern is. Google puts the definition as "*The Repository Pattern is a software design pattern that acts as an intermediary between your application's business logic and data storage, abstracting away the complexities of data access and providing a consistent interface for interacting with data.*"

### Benefits of the repository pattern

- **Improved Testability** We can easily mock these repositories during unit testing.

- **Decoupling Business Logic from Data Access** Sometimes we might not just run db queries but do some logic first before running. Helps decouples that from the controller.

- **Abstraction** We can easily implement different kinds of the same repository and use them interchangeably.

Which basically means, we have a central place to have all our data related logic. From my experience this pattern is very common in other ecosystems like Golang and NodeJS which makes sense because they are not big on using ORM. In the PHP world, this makes sense when using raw PHP but in terms of Laravel, I think, subjectively, Laravel Eloquent should be more than enough for majority of the applications out there.

## Why you don't need the repository pattern in Laravel?

For us to fully understand my position, I will list some of the usual arguments then counter them with why you might not need it:

- **What happens if you want to change your database?**: This is the major reason people make the argument for the repository pattern. I will counter that:

    - by asking, in real world production environment, how often have you seen application with active users change their database in your experience? In my case, it's been never. The primary database is always kept but maybe other databases are employed to help in regards of maybe performance, reporting etc... This ultimately leads to pre-mature optimization and in some sense over-engineering.

    - In addition, Laravel provides us with a very configurable database connection setup by default. In the rare instance you need something that isn't supported, there is almost always a community package that allows Eloquent to integrate with other databases without you doing anything special. All we have to do is define the connection and we can dynamically choose the right database in the application code.

- **Not cluttering the controllers and keeping business logic separated**: I believe in this school of thought actually, but in this case, you might not necessarily need a repository.

    - Business logic usually includes logging, events, notifications, instrumentation, etc... that are not just limited to querying the database. In this sense, what you need is a `Service` class or an `Action`.

    - Most of the repositories I have chanced upon then to just re-invent the wheel by just redefining the same logic Eloquent does for us.
    ```php
    class UserRepository
    {
        public function find(int $id): ?User
        {
            return User::find($id);
        }
    }
    ```

- **De-duplicating the codebase from writing the same query in multiple places**: This is a very good practice and skill needed to make applications maintainable as they grow, however, it doesn't necessitate the repository pattern.

    - Often times we share business logic between entry points in our systems (e.g. same logic in a controller and a console command) and not often the underlying queries. With that, I still believe, we can use a `Service` class or an `Action` to achieve the desired outcome.

    - We can use [Eloquent Query Scopes](https://laravel.com/docs/12.x/eloquent#query-scopes) or we can use helper methods on the Models to encapsulate some repeated queries.

    - When we need big queries or large customizations we can even use custom [Query Builders](https://martinjoo.dev/build-your-own-laravel-query-builders) in Laravel.

- **Improve testability by mocking repositories**: In other environments like Golang and NodeJS, I will ultimately agree with this, however in Laravel, we have a strong suite of solutions to aid in testing our applications. From database factories, mocking objects directly in the application container, useful traits such as `DatabaseTransactions`, `RefreshDatabase`, etc... that gives you a wide range of options to write unit tests that touch the database.
<br />
<br />

> [!CAUTION]
> One symptom I see about repository pattern is, they end up always re-implementing the same methods that exist in Eloquent. Another worst case is people injecting concrete repositories directly into controllers, commands etc... which defeats all the major advantage of the repository pattern; which is, being able to abstract and swap the data operations depending on the database.

## How to properly implement the repository pattern?

### Best practices to follow:
- Always pass the interface of the repository as dependency to your consuming classes such as controllers, commands, etc..
- Bind the needed concrete repository to the application container during service provider registration so it can be used to resolve the interface during dependency injection.
- The right concrete repository can be resolved by checking `config` value, data from the context or some sort of flag.

> [!IMPORTANT]
> **Always build to an interface of the repository** The main purpose of the repository pattern is to allow for abstraction and ability to also work with different databases etc..., if we are to attach the concrete implementation to our controllers, commands, etc... it defeats the purpose entirely.

### Example
One of the very few moments I needed to use repositories was in a reporting system where we had the raw data in our MySQL database, but for performance and some time-based queries, we used elastic search. This was in a GraphQL service but that's not really the subject for today.

**Context**
- We need to be able to call the same methods or get the same data for both MySQL and Elasticsearch.
- The database to be used can be passed as a GraphQL directive (`@realtime`) or as an HTTP header, or an artisan command option.
- We will set the database needed in the `Context` facade that can be used later.
- When resolving interfaces, we check the `Context` value to determine the right repository to return.

**Step 1:** We start by defining the methods we need on our interface

```php
namespace App\Repositories;

interface MetricRepositoryInterface
{
    public function getAggregatedSingleValueMetrics(): array;

    public function getMetricsOverTime(PeriodEnum $period): ?array;
    //...
}
```

**Step 2:** We build the concrete implementations of the `MetricRepositoryInterface`, in our case, we are building a repository for mysql database and another for elasticsearch.

```php
namespace App\Repositories;

class MysqlMetricRepository implements MetricRepositoryInterface
{
    public function getAggregatedSingleValueMetrics(): array
    {
        // query mysql tables
    }

    public function getMetricsOverTime(PeriodEnum $period): ?array
    {
        // query mysql tables
    }
}
```

```php
class ElasticsearchMetricRepository implements MetricRepositoryInterface
{
    public function getAggregatedSingleValueMetrics(): array
    {
        // query elasticsearch index
    }

    public function getMetricsOverTime(PeriodEnum $period): ?array
    {
        // query elasticsearch index
    }
}
```

**Step 3:** In our controller, we then accept the interface as a dependency that will be resolved to a concrete implementation during the application boot-up.

```php
namespace App\Http\Controllers;

use App\Enums\PeriodEnum;
use App\Repositories\MetricRepositoryInterface;
use Illuminate\Http\JsonResponse;

class MetricsController
{
    public function construct(private MetricRepositoryInterface $repository)
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

**Step 4:** How do we resolve which repository to use? Let's say hypothetically, we need the Elasticsearch implementation when it's set directly in the `Context` otherwise always return the MySQL implementation.

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
        $this->app->bind(MetricRepositoryInterface::class, function (Application $app): MetricRepositoryInterface {
            // This can be a config setting too eg. config('app.data_store')
            $database = Context::get('data_store');

            return $database === 'elasticsearch' ? new ElasticsearchMetricRepository() : new MysqlMetricRepository();
        });
    }
}
```

## What are the arguments for the repository pattern?
### What if you change your database?
The most common argument most people come up with to justify why they need repository pattern is what happens when you have to change your underlying data.
