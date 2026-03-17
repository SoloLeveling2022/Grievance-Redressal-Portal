'use client';

import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Utensils, DollarSign, Youtube, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language/language-provider';
import { CitizenLayout } from './patient/patient-layout';

interface Recipe {
  name: string;
  ingredients: string[];
  instructions: string;
  budget: 'Low' | 'Medium' | 'Costly';
  youtubeLink: string;
  diseaseRelevance: string;
}

interface RecipeSuggestionsProps {
  className?: string;
}

export default function RecipeSuggestions({ className }: RecipeSuggestionsProps) {
  const { t } = useLanguage();
  const [disease, setDisease] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMeal, setCurrentMeal] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const getMealType = (): string => {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 18) return 'snack';
    return 'dinner';
  };

  const getMealDisplayName = (meal: string): string => {
    switch (meal) {
      case 'breakfast': return t('breakfast');
      case 'lunch': return t('lunch');
      case 'dinner': return t('dinner');
      default: return t('dinner');
    }
  };

  let lastCall = 0;
  const MIN_INTERVAL = 5000; 
  
  const generateRecipes = async () => {
    const now = Date.now();
    if (now - lastCall < MIN_INTERVAL) {
      toast.error("Please wait before generating recipes again.");
      return;
    }
    lastCall = now;
  
    if (!disease.trim()) {
      toast.error(t('pleaseEnterDisease'));
      return;
    }
  
    setLoading(true);
    const mealType = getMealType();
    setCurrentMeal(mealType);
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyBZtRTyqSWs5SRZD52Er0WRZydTbP0s1ao");
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a smart AI nutritionist focused on providing culturally relevant, healthy Indian ${mealType} recipes. A user will input a specific health condition, and your job is to recommend **3 structured ${mealType} recipes** that:

1. Are suitable for the specified **health condition** (e.g., diabetes, fever, cough, ${disease}).
2. Follow traditional or modern **Indian cuisine styles**.
3. Include **budget classification**: "Low", "Medium", or "Costly".
4. Provide concise **Health Benefits**, **Ingredients**, and **Step-by-step Instructions**.
5. Use ingredients(have to be in listed ingredients: ${ingredients})) commonly found in Indian kitchens or easily available in Indian markets.(NOte: keep in mind about allergires also, make sure to provide the recipes that do not contain the listed allergies: ${allergies.join(', ')})
6. Are categorized for **${mealType}** only.
7. Output must be structured for rendering in frontend UI.
8. **AVOID chicken-related recipes unless the health condition specifically indicates protein deficiency**.
9. Focus on vegetarian options, lentils, pulses, and Indian spices.
10. Youtube link doesn't need to be an exact video link, it might be an link such that user when clicked sees the respectiev recipe search results(ie. search_query)

Here is the input you will get:
Health Condition: ${disease}
Current Meal Time: ${mealType}
Ingredients: ${ingredients.join(', ')}
Allergies: ${allergies.join(', ')}

---

## 🎯 Output Format Example (Strictly Follow This Format)

\`\`\`json
[
  {
    "name": "Moong Dal Khichdi",
    "budget": "Low",
    "diseaseRelevance": "Moong dal is light, easy to digest, and ideal for managing blood sugar levels. It provides proteins and fiber without spiking insulin.",
    "ingredients": [
      "1/2 cup moong dal (yellow split gram)",
      "1/2 cup rice",
      "1 tsp ghee",
      "1/4 tsp turmeric",
      "Salt to taste",
      "1/2 tsp cumin seeds",
      "1 chopped green chili (optional)",
      "1 tsp grated ginger"
    ],
    "instructions": "1. Wash rice and moong dal together and soak for 15 minutes. 2. Heat ghee in a pressure cooker, add cumin, ginger, chili. 3. Add soaked dal and rice, turmeric, salt, and 2 cups of water. 4. Pressure cook for 2-3 whistles. Serve hot with curd or pickle.",
    "youtubeLink": "https://youtube.com/watch?v=..."
  }
]
\`\`\`

🧠 Additional Tips for LLM Response Quality:
- Prefer traditional healing Indian spices like turmeric, cumin, ginger, garlic, asafoetida, fenugreek
- Avoid high-sugar, high-fat ingredients
- Mention regional names where suitable (e.g., Rasam, Pongal, Tandoori, Upma, Dosa)
- Ensure preparation time is short (under 45 mins ideally)
- Avoid generic recipes like "grilled salmon" unless Indianized (e.g., "Tandoori Salmon")
- Focus on seasonal and locally available ingredients
- Include traditional Indian cooking methods (pressure cooking, slow cooking, tempering)
- Emphasize the therapeutic properties of Indian spices and herbs

Make sure the recipes are practical, healthy, and specifically beneficial for ${disease} citizens while being culturally appropriate for Indian cuisine.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedRecipes = JSON.parse(jsonMatch[0]);
        setRecipes(parsedRecipes);
        toast.success(t('recipesGeneratedSuccessfully'));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      toast.error(t('failedToGenerateRecipes'));
    } finally {
      setLoading(false);
    }
  };

  const getBudgetIcon = (budget: string) => {
    switch (budget) {
      case 'Low':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'Medium':
        return <DollarSign className="h-4 w-4 text-yellow-600" />;
      case 'Costly':
        return <DollarSign className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getBudgetColor = (budget: string) => {
    switch (budget) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Costly':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <CitizenLayout>
    <div className={`w-full max-w-6xl mx-auto p-6 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t('aiDietAssistant')}
        </h2>
        <p className="text-gray-600">
          {t('getPersonalizedRecipes')}
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="disease" className="text-sm font-medium text-gray-700 mb-2 block">
              {t('healthCondition')}
            </Label>
            <Input
              id="disease"
              type="text"
              placeholder={t('healthConditionPlaceholder')}
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="ingredients" className="text-sm font-medium text-gray-700 mb-2 block">
              {t('ingredients')} ({t('commaSeparated')})
            </Label>
            <Input
              id="ingredients"
              type="text"
              placeholder={t('ingredientsPlaceholder')}
              value={ingredients.join(', ')}
              onChange={(e) => setIngredients(e.target.value.split(',').map(item => item.trim()).filter(item => item.length > 0))}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="allergies" className="text-sm font-medium text-gray-700 mb-2 block">
              {t('allergies')} ({t('commaSeparated')})
            </Label>
            <Input
              id="allergies"
              type="text"
              placeholder={t('allergiesPlaceholder')}
              value={allergies.join(', ')}
              onChange={(e) => setAllergies(e.target.value.split(',').map(item => item.trim()).filter(item => item.length > 0))}
              className="w-full"
            />
          </div>
          <Button 
            onClick={generateRecipes} 
            disabled={loading || !disease.trim()}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <Utensils className="mr-2 h-4 w-4" />
                {t('getRecipes')}
              </>
            )}
          </Button>
        </div>
        
        {currentMeal && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{t('currentMealTime')}: <strong>{getMealDisplayName(currentMeal)}</strong></span>
          </div>
        )}
      </div>

      {/* Recipes Display */}
      {recipes.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            {t('recommendedRecipes')} {t('for')} {getMealDisplayName(currentMeal)}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, index) => (
              <Card key={index} className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {recipe.name}
                    </CardTitle>
                    <Badge className={`ml-2 flex-shrink-0 ${getBudgetColor(recipe.budget)}`}>
                      {getBudgetIcon(recipe.budget)}
                      <span className="ml-1">{recipe.budget}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Disease Relevance */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('healthBenefits')}</h4>
                    <p className="text-sm text-gray-600">{recipe.diseaseRelevance}</p>
                  </div>

                  {/* Ingredients */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('ingredients')}</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {recipe.ingredients.map((ingredient, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div className="mb-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('instructions')}</h4>
                    <p className="text-sm text-gray-600 line-clamp-4">{recipe.instructions}</p>
                  </div>

                  {/* YouTube Link */}
                  {recipe.youtubeLink && (
                    <div className="mt-auto">
                      <a
                        href={recipe.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Youtube className="h-4 w-4" />
                        {t('watchRecipeVideo')}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">{t('importantDisclaimer')}</h4>
                <p className="text-sm text-amber-700">
                  {t('aiGeneratedContent')}
                </p>
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={generateRecipes}
              disabled={loading}
              className="mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('generating')}
                </>
              ) : (
                t('regenerateRecipes')
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
    </CitizenLayout>
  );
}
