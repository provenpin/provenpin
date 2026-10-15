from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

class Sentiment(BaseModel):
    label: str = Field(pattern="^(positive|negative|neutral)$")
    score: float = Field(ge=0, le=1)

parser = PydanticOutputParser(pydantic_object=Sentiment)
prompt = ChatPromptTemplate.from_messages([
    ("system", "Classify sentiment.\n{format_instructions}"),
    ("human", "{text}"),
]).partial(format_instructions=parser.get_format_instructions())

def build_chain(model: BaseChatModel):
    return prompt | model | parser
