// components/InfoCards.tsx
import Tooltip from '@/components/Tooltip';
import tutorialMaterials from '@/components/ai/AiModelsTutorialMaterials.json';

interface InfoCardsProps {
  setOpenDialog: (dialog: string | null) => void;
}

export default function InfoCards({ setOpenDialog }: InfoCardsProps) {
  return (
    <div className="my-16 w-full max-w-md flex flex-col justify-start">
      <ul className="space-y-4 h-3/4 overflow-y-auto">
        {tutorialMaterials.map((item) => (
          <li key={item.dialogKey}>
            <Tooltip content={item.description.replace(/<[^>]+>/g, '').slice(0, 1000)} variant='info-bottom'>
              <button
                onClick={() => setOpenDialog(item.dialogKey)}
                className="cursor-pointer w-full flex space-x-4 items-center bg-gray-100 text-gray-600 p-3 rounded-lg hover:bg-gray-200 transition-colors shadow-md hover:shadow-lg"
              >
                <img src={item.icon} className="h-6 w-6 flex-shrink-0" alt={`${item.title} icon`} />
                <div className="text-left flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 truncate">{item.title}</h4>
                  <p className="text-xs text-gray-600 truncate">{item.description.replace(/<[^>]+>/g, '').slice(0, 50)}...</p>
                </div>
              </button>
              </Tooltip>
           
          </li>
        ))}
      </ul>
    </div>
  );
}