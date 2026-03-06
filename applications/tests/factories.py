import factory
from datetime import date, datetime, timezone

from applications.models import (
    Application,
    ApplicationAttachment,
    ApplicationContact,
    ApplicationNote,
    InterviewStage,
    Tag,
)
from users.models import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    password = factory.PostGenerationMethodCall("set_password", "testpass123")


class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag

    user = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda n: f"tag-{n}")
    color = "#3B82F6"


class ApplicationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Application

    user = factory.SubFactory(UserFactory)
    company = factory.Faker("company")
    position = factory.Faker("job")
    status = "applied"
    applied_date = factory.LazyFunction(date.today)
    notes = ""


class ApplicationNoteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ApplicationNote

    application = factory.SubFactory(ApplicationFactory)
    content = factory.Faker("sentence")


class ApplicationContactFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ApplicationContact

    application = factory.SubFactory(ApplicationFactory)
    name = factory.Faker("name")
    email = factory.Faker("email")
    role = "Recruiter"


class InterviewStageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InterviewStage

    application = factory.SubFactory(ApplicationFactory)
    stage_type = "phone_screen"
    scheduled_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    completed = False
